import { NextResponse } from "next/server";

export class ArgumentError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ArgumentError';
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class InternalError extends Error {
  statusCode = 500;
  constructor(message: string = "Unknown error") {
    super(message);
    this.name = 'InternalError';
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof Error) {
    if (error instanceof ArgumentError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    if (error instanceof InternalError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ message: "Unknown error" }, { status: 500 });
}

export function ok() {
  return NextResponse.json({ message: "OK" }, { status: 200 });
}
