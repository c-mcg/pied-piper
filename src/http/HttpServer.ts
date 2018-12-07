import express from 'express'
import http from 'http'

import Endpoint from '../endpoints/Endpoint'
import SocketServer from './../socket/SocketServer';
import HttpClient from './HttpClient'
import { METHODS } from '../Constants'

export default class HttpServer {
    private port:number;
    private baseServer:http.Server;
    private endpoints:{ [s: string]: Endpoint };

    public readonly socketServer:SocketServer;

    constructor(port:number, express:express.Express, endpoints:{ [s: string]: Endpoint }={}) {
        this.port = port;
        this.endpoints = endpoints;
        this.baseServer = new http.Server(express);
        this.socketServer = new SocketServer(this.baseServer, this.endpoints);

        this.registerEndpoints(express);
    }

    private registerEndpoints(express:express.Express) {
        Object.keys(this.endpoints).forEach((endpoint) => {
            METHODS.forEach((method) => {
                const functionName = method.toLowerCase();
                express[functionName](`/${endpoint}`, this.createRouteHandler(endpoint, method));
            });
        });
    }

    private createRouteHandler(endpoint, method) {
        return (req:express.Request, res:express.Response) => {
            const httpClient:HttpClient = new HttpClient(req, res, this.socketServer);
            const payload = Object.keys(req.query).length === 0 ? "" : JSON.stringify(req.query);
            this.socketServer.handleEndpoint(endpoint, payload, httpClient, method);
        }
    }

    public start() {
        this.baseServer.listen(this.port);
    }
}