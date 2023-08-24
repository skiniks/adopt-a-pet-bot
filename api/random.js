import axios from 'axios';
import dotenv from 'dotenv';
import pkg from '@atproto/api';
import request from 'superagent';

const { BskyAgent, AppBskyFeedPost, RichText } = pkg;

dotenv.config();

const PETFINDER_API_KEY = process.env.PETFINDER_API_KEY;
const PETFINDER_SECRET = process.env.PETFINDER_SECRET;
const BSKY_USERNAME = process.env.BSKY_USERNAME;
const BSKY_PASSWORD = process.env.BSKY_PASSWORD;

const TOKEN_URL = 'https://api.petfinder.com/v2/oauth2/token';
const ANIMALS_URL = 'https://api.petfinder.com/v2/animals';

let token = '';

async function fetchPetfinderToken() {
    try {
        const response = await axios.post(TOKEN_URL, {
            grant_type: 'client_credentials',
            client_id: PETFINDER_API_KEY,
            client_secret: PETFINDER_SECRET
        });
        token = response.data.access_token;
    } catch (error) {
        console.error('Error fetching Petfinder token:', error.message);
    }
}

async function getRandomPet() {
    try {
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {
                sort: 'random',
                limit: 1
            }
        };

        const response = await axios.get(ANIMALS_URL, config);

        if (response.data && response.data.animals && response.data.animals.length > 0) {
            const pet = response.data.animals[0];
            let photoUrls = [];
            if (pet.photos && pet.photos.length > 0) {
                photoUrls = pet.photos.map(photo => photo.large);
            }

            const postSuccess = await createPost({
                name: pet.name,
                description: pet.description,
                contact: pet.contact,
                species: pet.species,
                age: pet.age,
                url: pet.url,
                photoUrls: photoUrls
            });

            if (!postSuccess) {
                console.log("Failed to create a post with current pet. Trying another one...");
                await getRandomPet();
            }
        } else {
            console.log('No pets found.');
        }
    } catch (error) {
        console.error('Error fetching a random pet:', error.message);
    }
}

const getImageAsBuffer = async (imageUrl) => {
    try {
        const res = await request.get(imageUrl).responseType('blob');
        return res.body;
    } catch (err) {
        console.error('Error fetching the image as a buffer:', err);
        return null;
    }
};

const createPost = async (petDetails) => {
    try {
        const agent = new BskyAgent({ service: 'https://bsky.social' });
        await agent.login({ identifier: BSKY_USERNAME, password: BSKY_PASSWORD });

        const imageBuffers = await Promise.all(petDetails.photoUrls.slice(0, 4).map(url => getImageAsBuffer(url)));
        const imageBlobRefs = [];

        for (let buffer of imageBuffers) {
            if (buffer) {
                const imageBlobResponse = await agent.uploadBlob(buffer, { encoding: 'image/jpeg' });
                imageBlobRefs.push(imageBlobResponse.data.blob);
            } else {
                console.error('Failed to retrieve an image buffer.');
            }
        }

        const postText = `Meet ${petDetails.name}, located in ${petDetails.contact.address.city}, ${petDetails.contact.address.state}.\n\nLearn more: ${petDetails.url}`;

        const rt = new RichText({ text: postText });
        await rt.detectFacets(agent);

        const imagesEmbed = imageBlobRefs.map(blobRef => ({
            $type: 'app.bsky.embed.image',
            image: blobRef,
            alt: postText,
        }));

        const postRecord = {
            $type: 'app.bsky.feed.post',
            text: rt.text,
            facets: rt.facets,
            embed: {
                $type: 'app.bsky.embed.images',
                images: imagesEmbed
            },
            createdAt: new Date().toISOString()
        };

        if (AppBskyFeedPost.isRecord(postRecord)) {
            const res = AppBskyFeedPost.validateRecord(postRecord);
            if (res.success) {
                const response = await agent.post(postRecord);
                console.log('Post successful:', response);
                return true;
            } else {
                console.error('Invalid Post Record:', res.error);
                return false;
            }
        }
    } catch (err) {
        console.error('Error creating post:', err);
        return false;
    }
};

export default async (_req, res) => {
    try {
        await fetchPetfinderToken();
        await getRandomPet();
        res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
