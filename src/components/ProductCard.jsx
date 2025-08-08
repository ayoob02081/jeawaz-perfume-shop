function ProductCard() {
  return (
    <div className="flex items-center justify-center p-4 w-[21.6rem] h-[13.5rem] bg-white rounded-2xl border-[1.5px] border-[#EBEBEB]">
      <div className="flex items-start justify-between gap-4 w-full h-full">
        <div className="bg-amber-300 h-20 w-[4.5rem]">
          <div>image</div>
        </div>
        <div className="flex flex-col justify-cen w-56 h-[11rem]">
          <div className="bg-green-200 flex items-center justify-between mb-4">
            <div>type</div>
            <div>man</div>
          </div>
          <div className="bg bg-red-100 flex items-center justify-between mb-2">
            <p>1</p>
            <div>original</div>
          </div>
          <div className="bg-blue-100 flex flex-col gap-1 pb-6 border-b border-[#EBEBEB] ">
            <p>2222</p>
            <p>333333</p>
          </div>
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex grow bg-red-200 items-center justify-center gap-2 w-full h-full py-2">
              <p>price</p>
              <p>toman</p>
            </div>
            <div>icon</div>
          </div>
          {/* <div className="flex flex-col gap-2"></div> */}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
