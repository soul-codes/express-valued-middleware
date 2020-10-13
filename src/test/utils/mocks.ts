import { Request, Response } from "express";

export const mockRequest = () => ({} as Request);
export const mockResponse = () => {
  const status = jest.fn((_) => obj);
  const send = jest.fn((_) => obj);
  const sendStatus = (_status: any) => {
    status(_status);
    send({
      content:
        "the send content in sendStatus was mocked and shouldn't be asserted.",
    });
    return obj;
  };
  const obj: any = { send, status, sendStatus, mocks: { send, status } };
  return obj as Response & {
    mocks: { send: typeof send; status: typeof status };
  };
};
export const mockNext = () => jest.fn();
