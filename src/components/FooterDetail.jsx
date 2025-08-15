import Image from "next/image";

function FooterDetail() {
  return <div className="flex items-center justify-between gap-4 w-[21.6rem] h-16">
    <div className="bg-white p-4 rounded-full ">
      <Image
        className="w-full h-full"
        src="/images/category stroke.svg"
        alt="products icon"
        width={24}
        height={24}
      />
    </div>
    <div className="grow flex flex-col items-center justify-between gap-1 ">
      <p className="font-bold">Lorem ipsum dolor sit.</p>
      <p>Lorem, ipsum dolor.</p>
    </div>
  </div>;
}

export default FooterDetail;
