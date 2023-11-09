export const retry = async (func: () => void, retryCount = 3) => {
  for (let i = 0; i < retryCount; i += 1) {
    try {
      return await func();
    } catch (err) {
      console.log(`Retry Error: ${err}`);
    }
  }
};
