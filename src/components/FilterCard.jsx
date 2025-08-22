function FilterCard() {
  return (
    <div className="snap-center">
      <div className="grow grid grid-cols-3 w-72 h-24 justify-center items-center justify-items-center bg-white rounded-2xl border-[1.5px] border-[#EBEBEB] ">
        <div className=" h-full w-full self-center justify-self-center p-3">
          <div className="flex items-center justify-center bg-amber-300 h-[4.5rem] w-[4.5rem] rounded-xl">
            image
          </div>
        </div>
        <div className="bg-blue-100 flex flex-col gap-1 py-4 justify-self-start border-b border-[#EBEBEB] ">
          <p>2222</p>
          <p>333333</p>
        </div>
        <div className="justify-self-end self-end p-4">icon</div>
      </div>
    </div>
  );
}

export default FilterCard;
