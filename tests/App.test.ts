import mockExpress from 'express';

import App from '@app/App';
import { REQUEST_METHODS } from '@app/Constants';
import MockHttpServer from '@http/HttpServer';
import MockSocketServer from '@socket/SocketServer';

const mockHttpServer = {
    socketServer: new MockSocketServer(null, null),
    start: jest.fn(),
};

jest.mock('express');
jest.mock("@socket/SocketServer");
jest.mock('@http/HttpServer', () =>
    jest.fn<MockHttpServer>().mockImplementation(() => mockHttpServer),
);

describe('App', () => {
    const mockEndpoint: any = REQUEST_METHODS.reduce((handlers, method) => {
        handlers[method.toLowerCase()] = jest.fn();
        return handlers;
    }, {});
    const mockEndpoints: any = { test: mockEndpoint };
    const testPort = 99;

    let app;

    beforeEach(() => {
        app = new App(testPort, mockEndpoints);
    });

    it('can be created', () => {
        expect(app).toBeInstanceOf(App);
        expect(app).toHaveProperty('express');
        expect(app).toHaveProperty('httpServer');
        expect(app).toHaveProperty('io', mockHttpServer.socketServer);

        expect(MockHttpServer as any).toHaveBeenCalledWith(app, testPort, mockExpress(), mockEndpoints);
        expect(mockHttpServer.start).toHaveBeenCalled();
    });

    describe('validatePayload', () => {
        it('will accept valid JSON', () => {
            expect(app.validatePayload("{}")).toBe(true);
        });

        it('will allow an empty payload', () => {
            expect(app.validatePayload("")).toBe(true);
        });

        it('will deny invalid json', () => {
            expect(app.validatePayload("invalid json")).toBe(false);
        });
    });

    describe('onRequest', () => {
        const mockRequest = { onError: jest.fn() };
        const mockPayload = "{}";

        REQUEST_METHODS.forEach((method) => {
            method = method.toLowerCase();
            it(`can handle an endpoint with method: ${method}`, () => {
                app.validatePayload = jest.fn().mockReturnValue(true);

                app.onRequest('test', mockPayload, mockRequest, method);

                expect(mockEndpoint[method])
                    .toHaveBeenCalledWith(mockPayload, mockRequest, app.io);
                expect(app.validatePayload)
                    .toHaveBeenCalledWith(mockPayload);
            });
        });

        it('wont handle an endpoint if invalid payload', () => {
            app.validatePayload = jest.fn().mockReturnValue(false);

            app.onRequest('test', mockPayload, mockRequest);

            REQUEST_METHODS.forEach((method) => {
                expect(mockEndpoint[method.toLowerCase()]).not.toHaveBeenCalled();
            });
            expect(app.validatePayload).toHaveBeenCalledWith(mockPayload);
            expect(mockRequest.onError).toHaveBeenCalled();
        });
    });
});
