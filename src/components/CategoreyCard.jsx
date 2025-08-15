function CategoreyCard() {
  return (
    <div className=" grid grid-cols-3 w-[21.6rem] h-24 justify-center items-center justify-items-center bg-white rounded-2xl border-[1.5px] border-[#EBEBEB] ">
      <div className="h-full w-full self-start justify-self-start px-4">
        <div className="flex items-center justify-center bg-amber-300 h-20 w-16 rounded-b-xl">
          image
        </div>
      </div>
      <div className="bg-blue-100 flex flex-col gap-1 p-4 border-b border-[#EBEBEB] ">
        <p>2222</p>
        <p>333333</p>
      </div>
      <div className="justify-self-end self-end p-4">icon</div>
    </div>
  );
}

export default CategoreyCard;
