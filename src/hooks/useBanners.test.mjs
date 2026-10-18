import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { homeBannerView } from "../utils/homeSectionView.mjs";
const require=createRequire(import.meta.url),{transformSync}=require("next/dist/build/swc");
function optionsFor(request) {
  const source=readFileSync(new URL("./useBanners.js",import.meta.url),"utf8");
  const {code}=transformSync(source,{filename:"useBanners.js",module:{type:"commonjs"},jsc:{parser:{syntax:"ecmascript"}}});
  const exports={},deps={"@/services/bannerServices":{getActiveBannersApi:request},"@/utils/showApiError":{},"@tanstack/react-query":{useQuery:options=>options},"next/navigation":{},"react-hot-toast":{}};
  new Function("require","exports",code)(name=>{assert(Object.hasOwn(deps,name),name);return deps[name];},exports);
  return {...exports.useGetActiveBanners({type:"primary"}),retryDelay:0,gcTime:Infinity};
}
const apiError=status=>Object.assign(new Error("synthetic API error"),{response:{status}});
const banner={id:1,imageUrl:"/uploads/banner.png"};
test("a transient active-banner 503 recovers with one bounded retry",async()=>{
  let calls=0;const options=optionsFor(async()=>{if(++calls===1)throw apiError(503);return[banner];}),client=new QueryClient();
  try{assert.deepEqual(await client.fetchQuery(options),[banner]);assert.equal(calls,2);}finally{client.clear();}
});
test("network failure retries once, while persistent error remains an error rather than an empty response",async()=>{
  let calls=0;const error=new Error("synthetic network failure"),options=optionsFor(async()=>{calls++;throw error;}),client=new QueryClient();
  try{await assert.rejects(client.fetchQuery(options),e=>e===error);assert.equal(calls,2);assert.equal(client.getQueryState(options.queryKey).status,"error");assert.equal(client.getQueryData(options.queryKey),undefined);}finally{client.clear();}
});
for(const error of [apiError(400),apiError(401),apiError(403),apiError(429),Object.assign(Error("cancelled"),{code:"ERR_CANCELED"}),Object.assign(Error("session superseded"),{code:"ERR_SESSION_SUPERSEDED"})])test("banner retry excludes "+(error.response?.status??error.code),async()=>{
  let calls=0;const options=optionsFor(async()=>{calls++;throw error;}),client=new QueryClient();
  try{await assert.rejects(client.fetchQuery(options));assert.equal(calls,1);}finally{client.clear();}
});
test("a failed mounted banner query recovers on focus without refetching healthy data",async()=>{
  let failed=true,calls=0;const options=optionsFor(async()=>{calls++;if(failed)throw apiError(503);return[banner];}),client=new QueryClient(),observer=new QueryObserver(client,options),off=observer.subscribe(()=>{});
  try{
    await assert.rejects(client.fetchQuery(options));assert.equal(observer.getCurrentResult().isError,true);
    assert.equal(observer.shouldFetchOnWindowFocus(),true);
    failed=false;client.getQueryCache().onFocus();assert.deepEqual(await client.fetchQuery(options),[banner]);
    const successfulCalls=calls;assert.equal(observer.shouldFetchOnWindowFocus(),false);client.getQueryCache().onFocus();await new Promise(setImmediate);assert.equal(calls,successfulCalls);
  }finally{off();client.clear();}
});
test("genuinely empty active-banner data remains empty and hidden without retries",async()=>{
  let calls=0;const options=optionsFor(async()=>{calls++;return[];}),client=new QueryClient();
  try{const banners=await client.fetchQuery(options);assert.equal(calls,1);assert.equal(homeBannerView({isPending:false,isError:false,banners}),"hidden");}finally{client.clear();}
});
test("fresh mounts and client-navigation remounts retain active-banner contracts",async()=>{
  for(let refresh=0;refresh<3;refresh++){
    let calls=0;const client=new QueryClient(),options=optionsFor(async()=>{calls++;return[banner];});
    const first=new QueryObserver(client,options),off=first.subscribe(()=>{});
    try{
      assert.equal(homeBannerView(first.getCurrentResult()),"loading");await client.fetchQuery(options);assert.equal(first.getCurrentResult().data[0].id,1);off();
      const remount=new QueryObserver(client,options),stop=remount.subscribe(()=>{});
      try{assert.equal(remount.getCurrentResult().data[0].id,1);await client.fetchQuery(options);assert(calls<=2);}finally{stop();}
    }finally{off();client.clear();}
  }
});
