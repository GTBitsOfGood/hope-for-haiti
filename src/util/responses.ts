import { NextResponse } from "next/server";

export function argumentError(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export function notFoundError(message: string) {
  return NextResponse.json({ message }, { status: 404 });
}

export function internalError() {
  return NextResponse.json({ message: "Unknown error" }, { status: 500 });
}

export function ok() {
  return NextResponse.json({ message: "OK" }, { status: 200 });
}
