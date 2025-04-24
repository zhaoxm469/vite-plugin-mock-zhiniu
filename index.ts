import type { Plugin } from 'vite';
import type { Server } from 'http';
import type { IncomingMessage, ServerResponse } from 'http';

interface MockResponse {
    [key: string]: any;
    isMock: boolean;
}

interface RouterMap {
    [path: string]: {
        default?: ((req: IncomingMessage & { body?: any }, res: ServerResponse) => Promise<any>) | Record<string, any>;
    } | ((req: IncomingMessage & { body?: any }, res: ServerResponse) => Promise<any>) | Record<string, any>;
}

interface MockPluginOptions {
    routerMap: RouterMap;
}

async function parseJson(req: IncomingMessage): Promise<any> {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const jsonStr = JSON.parse(body);
                resolve(jsonStr);
            } catch (err) {
                console.warn('Failed to parse JSON:', err);
                resolve(null);
            }
        });
        req.on('error', (err) => {
            console.error('Request error:', err);
            resolve(null);
        });
    });
}

/**
 * Vite plugin for mocking API responses
 * @param options - Plugin configuration options
 * @returns Vite plugin instance
 */
export default function mockPlugin({ routerMap = {} }: MockPluginOptions): Plugin {
    return {
        name: 'mock-proxy-plugin',
        configureServer({ middlewares }) {
            Object.keys(routerMap).forEach((path) => {
                middlewares.use(path, async (req: IncomingMessage & { body?: any }, res: ServerResponse) => {

                    const url = new URL(req.url || '', `http://${req.headers.host}`);
                    const queryParams = Object.fromEntries(url.searchParams) || {};

                    if (queryParams && Object.keys(queryParams).length > 0) {
                        (req as any).query = queryParams;
                    }

                    try {
                        // Set response headers
                        res.setHeader('Content-Type', 'application/json');

                        const content = routerMap[path];
                        let responseContent: any;

                        // Parse request body for POST requests
                        if (req.method === 'POST') {
                            req.body = await parseJson(req);
                        }

                        // Handle different content types
                        if (content && typeof content === 'object') {
                            if (content.default) {
                                if (typeof content.default === 'function') {
                                    responseContent = await content.default(req, res);
                                } else if (typeof content.default === 'object') {
                                    responseContent = content.default;
                                }
                            } else if (typeof content === 'function') {
                                responseContent = await content(req, res);
                            } else {
                                responseContent = content;
                            }
                        }

                        // Ensure response is an object
                        if (!responseContent || typeof responseContent !== 'object') {
                            responseContent = {};
                        }

                        // Add mock flag and send response
                        const mockResponse: MockResponse = {
                            ...responseContent,
                            isMock: true
                        };

                        res.end(JSON.stringify(mockResponse));
                    } catch (error) {
                        console.error('Error processing mock request:', error);
                        res.statusCode = 500;
                        res.end(JSON.stringify({
                            error: 'Internal Server Error',
                            message: error instanceof Error ? error.message : 'Unknown error',
                            isMock: true
                        }));
                    }
                });
            });
        },
    };
}