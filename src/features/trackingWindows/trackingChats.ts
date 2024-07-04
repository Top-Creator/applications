export const extractChatId = (url:string) => {
    const match = url.match(/\/chats\/(\d+)\/messages/);
    return match ? match[1] : null
};


