import * as createExpress from 'express';
import * as http from 'http';
import * as IO from 'socket.io';

import './types'

import SocketServer from './server/SocketServer'
import Route from './routes/Route'

export default class App {

    private port:number;

    public express:Express;
    public httpServer:HttpServer;
    public io:SocketServer;

    public readonly routes:{ [s: string]: Function; };

    constructor(port:number=8000) {
        this.port = port;

        this.express = createExpress();
        this.httpServer = new http.Server(this.express);
        this.io = new SocketServer(this.httpServer);

        this.createRoute = this.createRoute.bind(this);

        this.routes = {};
    }

    public createRoute(path:string, handlerFunc:AppRequestHandler) {
        const wrappedHandler:RequestHandler = (req:ExpressRequest, res:ExpressResponse, next:NextFunction) => handlerFunc(req, res, next, this);
        this.routes[path] = wrappedHandler;
        this.express.get(path, wrappedHandler);
    }

    public createRoutes(routes:Array<Route>) {
        routes.forEach((route) => {
            this.createRoute(route.path, route.handler);
        })
    }

    public start() {
        this.httpServer.listen(this.port);
    }
}
