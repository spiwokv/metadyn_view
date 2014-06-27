if(typeof compute==="undefined"){compute={};}
if(typeof compute.parser==="undefined"){compute.parser={};}
$.extend(compute.parser,{
    parse:function(toparse){
        if (typeof String.prototype.startsWith !== 'function') {
            String.prototype.startsWith = function(str) {
                return this.slice(0, str.length) === str;
            };
        }
        var lines=toparse.split("\n");
        var i=0;
        while(lines[i].startsWith("#!")){
            i++;
        }
        var params={filetype:"HILLS_1"};
        if(i>0){
            params.filetype="HILLS_2";
            var header=lines.slice(0,i);
            params=this.parseHeader(header,params);
        }else{
            params=this.analyzeFirstLine(lines[0],params);
        }
        var body=lines.slice(i+1);
        this.parseBody(body,params);
        manage.console.log("parsovano");
    },
    //parseCOLVAR:function(){},
    parseHeader:function(header,params){
        var line;
        line=header[0].match(/[^ ]+/g);
        params.timepos=0;
        var cvs=[];
        var p=2;
        while(!line[p].contains("sigma")){
            cvs.push($.extend({},compute.parser.tcv,{name:line[p],pos:p-2}));
            p++;
        }
        while(line[p].contains("sigma")){
            var elspl=line[p].split("_");
            var cv=this.getCVByName(cvs,elspl[1]);
            cv.sigmapos=p-2;
            p++;
        }
        params.heipos=p-2;
        for(;p<line.length;p++){
            if(line[p].contains(".bias")||line[p].contains("height")){
                params.heipos=p-2;
            }
            if(line[p].contains("clock")){
                params.timepos=p-2;
            }
        }
        params.fulllen=line.length-2;
        for(var i=1;i<header.length;i++){
            line=header[i].match(/[^ ]+/g);
            if(line[1]==="SET"){
                if(line[2].startsWith("min")){
                    var elspl=line[p].split("_");
                    var cv=this.getCVByName(cvs,elspl[1]);
                    var val=line[3];
                    if(val==="-pi"){
                        cv.min=-Math.PI;cv.periodic=true;
                    }else{
                        cv.min=parseFloat(val);
                    }
                }else if(line[2].startsWith("max")){
                    var elspl=line[p].split("_");
                    var cv=this.getCVByName(cvs,elspl[1]);
                    var val=line[3];
                    if(val==="pi"){
                        cv.max=Math.PI;cv.periodic=true;
                    }else{
                        cv.max=parseFloat(val);
                    }
                }else{
                    manage.console.log("Unknown parameter "+line[2]);
                }
            }
        }
        params.cvs=cvs;
        params.ncv=cvs.length;
    },
    implicitHeader:function(firstline,params){
        var line=firstline.match(/[^ ]+/g);
        params.timepos=0;
        var nelem=line.length;
        var ncv=Math.floor((nelem-2)/2);
        params.heipos=2*ncv+1;
        var cvs=[];
        for(var i=1;i<=ncv;i++){
            cvs.push($.extend({},compute.parser.tcv,{name:"CV_"+i,pos:i,sigmapos:ncv+i,defsigma:line[ncv+i]}));
        }
        params.ncv=ncv;
        params.fulllen=nelem;
    },
    parseBody:function(body,params){
        //var data={time:null,cvs:[],hei:null,sigma:[]};
        var nbody=body.length;
        var cvbuffer=new ArrayBuffer(4*nbody*params.ncv);
        var sigmabuffer=new ArrayBuffer(4*nbody*params.ncv);
        var restbuffer=new ArrayBuffer(4*nbody*2);
        var time,hei,cvs=[],sigma=[];
        for(var i=0;i<params.ncv;i++){
            cvs.push(new Float32Array(cvbuffer,4*i*nbody,nbody));
            sigma.push(new Float32Array(sigmabuffer,4*i*nbody,nbody));
        }
        time=new Float32Array(restbuffer,0,nbody);
        hei=new Float32Array(restbuffer,4*nbody,nbody);
        var line,timepos=params.timepos,heipos=params.heipos;
        var pcvs=params.cvs;
        var ncv=params.ncv;
        var fulllen=params.fulllen;
        for(var i=0;i<nbody;i++){
            line=body[i].match(/[^ ]+/g);
            if(line.length<fulllen){continue;}
            time[i]=parseFloat(line[timepos]);
            hei[i]=parseFloat(line[heipos]);
            for(var j=0;j<ncv;j++){
                var pcv=pcvs[j];
                cvs[j][i]=parseFloat(line[pcv.pos]);
                sigma[j][i]=parseFloat(line[pcv.sigmapos]);
            } 
        }
        for(var c=0;c<cvs.length;c++){
            this.findLimits(cvs[c],pcvs[c]);
        }
        var sorted=this.sortTime(time); // TODO
        var data={time:time,cvs:cvs,hei:hei,sigma:sigma,sorted:sorted};
        return data;
    },
    findLimits:function(array,cv){
        if(cv.min<cv.max){return;}
        var max=cv.max,min=cv.min;
        var nbody=array.length;
        if(min===100000000&&max===-100000000){
            for(var i=0;i<nbody;i++){
                if(array[i]<min){min=array[i];}
                if(array[i]>max){max=array[i];}
            }
        }else
        if(min===100000000) {
            if (array[i] < min) {min = array[i];}
        } else {
            if (array[i] > max) {max = array[i];}
        }
        cv.min=min;cv.max=max;
    },
    sortTime:function(array){
        
    },
    ask:function(toparse){},
    getCVByName:function(cvs,name){
        //var cvs=params.cvs;
        for(var i=0;i<cvs.length;i++){
            if(cvs[i].name===name){return cvs[i];}
        }
    }
});
compute.parser.tcv={
    name:null,
    min:100000000,
    max:-100000000,
    pos:null,
    sigmapos:null,
    periodic:false,
    defsigma:null
};
compute.parser.sorter={
    issorted:function(array){
        var len=array.length;
        if(len===1){return true;}
        for(var i=1;i<len;i++){
            if(!this.compare(array[i-1],array[i])){return false;}
        }
        return true;
    },
    compare:function(a,b){
        return a<=b;
    },
    findSplitPoint:function(array){
        var len=array.length;
        var middle=Math.floor(len/2);
        manage.console.log("SplitPoint from "+middle+" in <"+array+">");
        for(var i=0;i<middle;i++){
            if(!this.compare(array[middle+i],array[middle+i+1])){return middle+i+1;}
            if(!this.compare(array[middle-i-1],array[middle-i])){return middle-i+1;}
        }
        if(middle*2===len){
            if(!this.compare(array[len-2],array[len-1])){return len-1;}
        }
        manage.console.log("Error: no SplitPoint");
        return -1;
    },
    split:function(array){
        if(this.issorted(array)){
            return array;
        }else{
            var splpoint=this.findSplitPoint(array);
            if(splpoint===-1){return array;}
            //manage.console.log("Split on "+splpoint);
            var array1=array.slice(0,splpoint);
            var array2=array.slice(splpoint,array.length);
            return this.merge(this.split(array1),this.split(array2));
        }
    },
    merge:function(array1,array2){
        var narray=[];
        //manage.console.log("array1="+array1);
        //manage.console.log("array2="+array2);
        var i1=0,i2=0,nsum=array1.length+array2.length;
        for(var i=0;i<nsum;i++){
            if(this.compare(array1[i1],array2[i2])){
                narray.push(array1[i1]);i1++;
            }else{
                narray.push(array2[i2]);i2++;
            }
            if(i1===array1.length){
                for(var i=i2;i<array2.length;i++){
                    narray.push(array2[i]);
                }
                break;
            }
            if(i2===array2.length){
                for(var i=i1;i<array1.length;i++){
                    narray.push(array1[i]);
                }
                break;
            }
        }
        return narray;
    },
    sort:function(array){
        return this.split(array);
    }
};