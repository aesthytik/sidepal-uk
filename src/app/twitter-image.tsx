import { ImageResponse } from "next/og";
import { OG_SIZE, SocialCard } from "./_brand/mark";

export const alt = "Horus. Big plans. Clear next steps. Find UK employers that can sponsor your work visa.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<SocialCard />, OG_SIZE);
}
