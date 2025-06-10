// Ref: project2
import { createClient } from 'redis';
import { REDIS_PREFIX, redisOptions } from '../utils/dbconfig.js';

// Create a Redis client that can be reused
let redisClient = null;

// Helper function to get or create the Redis client
async function getRedisClient() {
  if (!redisClient) {
    console.log('Creating new Redis client');
    redisClient = createClient(redisOptions);
    
    redisClient.on('error', err => {
      console.error('Redis Client Error:', err);
      redisClient = null; // Reset the client on error
    });
    
    await redisClient.connect();
    console.log('Connected to Redis successfully');
  }
  
  return redisClient;
}

// Implement a function to fetch JSON objects from Redis cache
/**
 * @param {string} roomId - The room ID to fetch history for
 * @returns {Promise<Array|null>} The cached history or null if not found
 */
export async function fetchHistoryFromCache(roomId) {
  const key = `${roomId}`;
  
  try {
    // Get the Redis client
    const client = await getRedisClient();
  
    console.log(`Attempting to fetch history of room ${roomId} from cache`);
    const value = await client.get(key);
    const data = JSON.parse(value);
    // console.log(data);
    // If it is not, return null.
    if (data === null || Object.keys(data).length === 0){
      console.log("Cache Miss");
      return null
    }
    // IMPORTANT: Log the required steps
    console.log("Cache Hit");
    // const data = [];
    // for (const k in value){
    //   data.push(value[k]);
    // }
    return data
    // console.log("fetchFromCache function not yet implemented");
    // return null;   // update this
  } catch (error) {
    console.error(`Error fetching from Redis:`, error);
    return null;
  }
}

// Implement a function to cache JSON objects in Redis.
export async function cacheHistory(roomId, blob, expiration = 300) {
  // blob should be an array
  const key = `${roomId}`;
  
  try {
    // Get the Redis client
    const client = await getRedisClient();
    
    // TODO: Implement me!
    // Store the blob in the cache with the appropriate key.
    // IMPORTANT: Log the required steps
    let res;
    console.log("Writing data to cache");
    // for (let obj of blob){
    //   console.log(obj);
    //   const name = obj.name;
    //   res = await client.hSet(key, name)
    //   if (res === 0){
    //     console.log("Data is failed to stored in cache");
    //     return false;
    //   }
    //   res = await client.hSet(`${REDIS_PREFIX}${type}:${name}`, obj)
    //   if (res === 0){
    //     console.log("Data is failed to stored in cache");
    //     return false;
    //   }
    // }
    // res = await client.hSet(key, blob);
    res = await client.set(key, JSON.stringify(blob), { EX: expiration });
    if (res === 0){
      console.log("Data is failed to stored in cache");
      return false;
    }
    console.log("Cache has been written");
    return true;
    // console.log("Error when writing to cache");
    // console.log("cacheResult function not yet implemented");
    // return false;  // update this
  } catch (error) {
    console.error(`Error caching result:`, error);
    return false;
  }
}
