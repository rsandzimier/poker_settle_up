// Source: https://stackoverflow.com/questions/7343890/standard-deviation-javascript
Array.prototype.std = function() {
	var i,j,total = 0, mean = 0, diffSqredArr = [];
	for(i=0;i<this.length;i+=1){
		 total+=this[i];
	}
	mean = total/this.length;
	for(j=0;j<this.length;j+=1){
		 diffSqredArr.push(Math.pow((this[j]-mean),2));
	}
	return (Math.sqrt(diffSqredArr.reduce(function(firstEl, nextEl){
				return firstEl + nextEl;
			 })/this.length));
};

Array.prototype.sum = function() {
	return this.reduce((a,b) => a+b, 0);
}

Array.prototype.abs = function() {
	var arr = [...this];
	for (let i=0; i<arr.length; i++) {
		arr[i] = Math.abs(arr[i]);
	}
	return arr;
}