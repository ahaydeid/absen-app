import Image from "next/image";

export default function UnderDevelopment() {
  return (
    <div className="max-w-md mx-auto p-6">

      <div className="relative w-full h-72">
        {" "}
        <Image src="/img/underdev.gif" alt="Under development animation" fill className="object-contain" />
      </div>
      <h1 className="text-2xl font-semibold mt-5 mb-4 text-gray-600 text-center">Under Development</h1>
    </div>
  );
}
