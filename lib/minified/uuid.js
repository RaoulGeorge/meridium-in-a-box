﻿(function(){function r(r,e,n){var t=e&&n||0,u=0
for(e=e||[],r.toLowerCase().replace(/[0-9a-f]{2}/g,function(r){16>u&&(e[t+u++]=v[r])});16>u;)e[t+u++]=0
return e}function e(r,e){var n=e||0,t=l
return t[r[n++]]+t[r[n++]]+t[r[n++]]+t[r[n++]]+"-"+t[r[n++]]+t[r[n++]]+"-"+t[r[n++]]+t[r[n++]]+"-"+t[r[n++]]+t[r[n++]]+"-"+t[r[n++]]+t[r[n++]]+t[r[n++]]+t[r[n++]]+t[r[n++]]+t[r[n++]]}function n(r,n,t){var u=n&&t||0,o=n||[]
r=r||{}
var a=null!=r.clockseq?r.clockseq:m,f=null!=r.msecs?r.msecs:(new Date).getTime(),i=null!=r.nsecs?r.nsecs:h+1,c=f-g+(i-h)/1e4
if(0>c&&null==r.clockseq&&(a=a+1&16383),(0>c||f>g)&&null==r.nsecs&&(i=0),i>=1e4)throw Error("uuid.v1(): Can't create more than 10M uuids/sec")
g=f,h=i,m=a,f+=122192928e5
var s=(1e4*(268435455&f)+i)%4294967296
o[u++]=s>>>24&255,o[u++]=s>>>16&255,o[u++]=s>>>8&255,o[u++]=255&s
var l=f/4294967296*1e4&268435455
o[u++]=l>>>8&255,o[u++]=255&l,o[u++]=l>>>24&15|16,o[u++]=l>>>16&255,o[u++]=a>>>8|128,o[u++]=255&a
for(var v=r.node||p,d=0;6>d;d++)o[u+d]=v[d]
return n?n:e(o)}function t(r,n,t){var o=n&&t||0
"string"==typeof r&&(n="binary"==r?new s(16):null,r=null),r=r||{}
var a=r.random||(r.rng||u)()
if(a[6]=15&a[6]|64,a[8]=63&a[8]|128,n)for(var f=0;16>f;f++)n[o+f]=a[f]
return n||e(a)}var u,o=this
if("function"==typeof o.require)try{var a=o.require("crypto").randomBytes
u=a&&function(){return a(16)}}catch(f){}if(!u&&o.crypto&&crypto.getRandomValues){var i=new Uint8Array(16)
u=function(){return crypto.getRandomValues(i),i}}if(!u){var c=Array(16)
u=function(){for(var r,e=0;16>e;e++)0===(3&e)&&(r=4294967296*Math.random()),c[e]=r>>>((3&e)<<3)&255
return c}}for(var s="function"==typeof o.Buffer?o.Buffer:Array,l=[],v={},d=0;256>d;d++)l[d]=(d+256).toString(16).substr(1),v[l[d]]=d
var y=u(),p=[1|y[0],y[1],y[2],y[3],y[4],y[5]],m=16383&(y[6]<<8|y[7]),g=0,h=0,q=t
if(q.v1=n,q.v4=t,q.parse=r,q.unparse=e,q.BufferClass=s,"function"==typeof define&&define.amd)define(function(){return q})
else if("undefined"!=typeof module&&module.exports)module.exports=q
else{var w=o.uuid
q.noConflict=function(){return o.uuid=w,q},o.uuid=q}}).call(this)
