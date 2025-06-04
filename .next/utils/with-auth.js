export function withAuth(handler) {
    return async (req, res) => {
        const authHeader = req.headers['authorization'];
        const expectedKey = process.env.API_KEY;
        if (!authHeader || !expectedKey || authHeader !== expectedKey) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        await handler(req, res);
    };
}
