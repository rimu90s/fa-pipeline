// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Landing ke app shell (after login). Visit route sudah pasti ada di struktur Anda.
  redirect("/login");
}
