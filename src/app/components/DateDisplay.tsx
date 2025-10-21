"use client";
import { useEffect, useState } from "react";

export default function DateDisplay() {
  const [today, setToday] = useState("");

  useEffect(() => {
    const date = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setToday(date);
  }, []);

  return <span>{today}</span>;
}