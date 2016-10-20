function O() {
	this.toString = function(){ console.log("O.toString()"); return 'O' };
}
function P() {
	this.toString = function(){ console.log("P.toString()"); return 'P' };
}

var
    o = new O(),
    p = new P();

console.log(o>p);
