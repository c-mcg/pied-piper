import autoBind from 'auto-bind';
import express from 'express';

import App from '@app/App';
import Request from '@app/Request';

export default class HttpRequest extends Request {
    private req: express.Request;
    private res: express.Response;

    constructor(app: App, req: express.Request, res: express.Response) {
        super(app);
        autoBind(this);

        this.req = req;
        this.res = res;
    }

    public onSuccess(payload: string) {
        this.res.send(payload);
    }

    public onError(message: string) {
        const payload = { error: message };
        this.res.send(JSON.stringify(payload));
    }
}