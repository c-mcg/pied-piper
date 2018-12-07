
import http from 'http'

import SocketServer from '../SocketServer'

import Socket from './../Socket';

jest.mock('express');
jest.mock('http');
jest.mock('../Socket');

var ioStub = { // var so variable is hoisted
    on: jest.fn(),
    emit: jest.fn()
}
jest.mock('socket.io', () => (
    (httpServer) => ioStub
));

describe('SocketServer', () => {
    const socket:any = {}
    const endpoint:any = {}
    const payload:string = "{}";

    let socketServer:any = null;
    let mockHttpServer:any;

    beforeEach(() => {
        mockHttpServer = new http.Server();
        socketServer = new SocketServer(mockHttpServer, {});

        endpoint.handleEndpoint = jest.fn();
        socket.emitError = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    })

    it('can be created', () => {
        expect(socketServer).toBeTruthy();
        expect(socketServer.endpoints).toEqual({});
        expect(socketServer.io).toBeTruthy();
        expect(ioStub.on).toBeCalledWith('connection', socketServer.onConnectionRecieved);
    });

    it('can accept a socket', () => {
        const oldLog = console.log;
        console.log = jest.fn();

        const ioSocketStub = {};
        const recievedSocket = socketServer.onConnectionRecieved(ioSocketStub);

        // Verify we got a mock socket
        expect(Socket).toHaveBeenCalled();
        expect(recievedSocket).toHaveProperty('id', 'test');

        expect(console.log).toHaveBeenCalled();
        console.log = oldLog;
    });

    it('can accept a valid payload', () => {
        const validPayload = "{}";
        expect(socketServer.validatePayload(validPayload)).toBe(true);
    });

    it('can deny an invalid payload', () => {
        const invalidPayload = "invalid json";
        expect(socketServer.validatePayload(invalidPayload)).toBe(false);
    });

    it('can handle an endpoint', () => {
        socketServer = new SocketServer(mockHttpServer, {
            test: endpoint,
        });
        socketServer.validatePayload = jest.fn().mockReturnValue(true);
        
        socketServer.handleEndpoint('test', payload, socket);

        expect(endpoint.handleEndpoint)
            .toHaveBeenCalledWith(payload, socket, socketServer);
        expect(socketServer.validatePayload)
            .toHaveBeenCalledWith(payload);
    });

    it('wont handle an endpoint if invalid payload', () => {
        socketServer = new SocketServer(mockHttpServer, {
            test: endpoint,
        });
        socketServer.validatePayload = jest.fn().mockReturnValue(false);
        
        socketServer.handleEndpoint('test', payload, socket);

        expect(endpoint.handleEndpoint).not.toHaveBeenCalled();
        expect(socketServer.validatePayload).toHaveBeenCalledWith(payload);
        expect(socket.emitError).toHaveBeenCalled();
    });

});