import { NextResponse } from "next/server";

export function argumentError(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export function authenticationError(message: string) {
  return NextResponse.json({ message }, { status: 401 });
}

export function authorizationError(message: string) {
  return NextResponse.json({ message }, { status: 403 });
}

export function notFoundError(message: string) {
  return NextResponse.json({ message }, { status: 404 });
}

export function conflictError(message: string) {
  return NextResponse.json({ message }, { status: 409 });
}

export function internalError() {
  return NextResponse.json({ message: "Unknown error" }, { status: 500 });
}

export function ok() {
  return NextResponse.json({ message: "OK" }, { status: 200 });
}

export function successResponse<T>(data: T) {
  return NextResponse.json(data, { status: 200 });
}