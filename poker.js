const EPS = 1e-6;

var inputs = [document.getElementById('names'), document.getElementById('buyins'), document.getElementById('stacks'), document.getElementById('nets'), document.getElementById('roundto')];
function fit2page(evt) {
	// Resize Header Font
	var header = document.getElementById('header');
	var headerText = document.getElementById('headerText');
	var maxHeaderTextWidth = 0.8*header.offsetWidth;
	var headerFontSize = 1;
	headerText.style.fontSize = `${headerFontSize}px`;
	while (headerText.offsetWidth<maxHeaderTextWidth && headerFontSize<80) {
		headerText.style.fontSize = `${++headerFontSize}px`;
	}
	headerText.style.fontSize = `${--headerFontSize}px`;

	var cols = 1;
	inputs.forEach(el => el.cols=cols);
	while (document.getElementById('inputTable').offsetWidth<document.getElementById('subwrapper').offsetWidth) {
		cols++;
		inputs.forEach(el => el.cols=cols);
	}
	cols--;
	inputs.forEach(el => el.cols=cols);
}
if(window.attachEvent) {
    window.attachEvent('onload', fit2page);
} else {
    if(window.onload) {
        var curronload = window.onload;
        var newonload = function(evt) {
            curronload(evt);
            fit2page(evt);
        };
        window.onload = newonload;
    } else {
        window.onload = fit2page;
    }
}
window.addEventListener('resize', fit2page);
window.addEventListener('orientationchange', fit2page);
screen.orientationchange = fit2page;

var netcheck = document.getElementById('netcheck');
netcheck.onclick = () => {
	if (netcheck.checked) {
		inputs[1].readOnly = true;
		inputs[2].readOnly = true;
		inputs[3].readOnly = false;
	} else {
		inputs[1].readOnly = false;
		inputs[2].readOnly = false;
		inputs[3].readOnly = true;
	}
}

var nameArr = [];
function updateNames() { nameArr = inputs[0].value.split('\n'); }
inputs[0].oninput = updateNames;
var netArr = [];
function updateNets() {
	if (netcheck.checked) {
		netArr = inputs[3].value.split('\n').map(x => roundTo(parseFloat(x),2));
	} else {
		var buyinArr = inputs[1].value.split('\n').map(x => roundTo(parseFloat(x),2));
		var stackArr = inputs[2].value.split('\n').map(x => roundTo(parseFloat(x),2));
		netArr = [];
		for (let i=0; i<Math.min(buyinArr.length,stackArr.length); i++) {
			netArr.push(roundTo(stackArr[i]-buyinArr[i],2));
		}
		inputs[3].value = netArr.map(x=>x.toFixed(2)).join('\n');
	}
}
inputs[1].oninput = updateNets;
inputs[2].oninput = updateNets;
inputs[3].oninput = updateNets;

var round_to = 0.01;
function updateRoundTo(){
	round_to = parseFloat(inputs[4].value);
}
inputs[4].oninput = updateRoundTo;

function checkInput() {
	var errorStr = '';

	var names = inputs[0].value.split('\n');
	var buyins = inputs[1].value.split('\n');
	var stacks = inputs[2].value.split('\n');
	var nets = inputs[3].value.split('\n');
	var roundto = inputs[4].value;

	if (netcheck.checked) {
		if (names.length != nets.length) {
			errorStr+= 'Number of names must equal number of Nets\n';
		}
		nets.forEach(entry => {
			if (isNaN(parseFloat(entry))) errorStr+= `Net "${entry}" must be a number\n`;
		});
	} else {
		if (names.length != buyins.length) {
			errorStr+= 'Number of names must equal number of Buy-Ins\n';
		}
		if (names.length != stacks.length) {
			errorStr+= 'Number of names must equal number of Final Stacks\n';
		}
		buyins.forEach(entry => {
			if (isNaN(parseFloat(entry))) errorStr+= `BuyIn "${entry}" must be a number\n`;
		});
		stacks.forEach(entry => {
			if (isNaN(parseFloat(entry))) errorStr+= `Final Stack "${entry}" must be a number\n`;
		});
	}

	var nets_sum = nets.reduce((a, b) => parseFloat(a) + parseFloat(b));
	if (!isNaN(nets_sum) && Math.abs(nets_sum) > EPS){
		errorStr+= `Sum of nets must be 0\n`;
	}

	if (isNaN(parseFloat(roundto))) {
		errorStr+= `Round to nearest "${roundto}" must be a number\n`;
	}
	else if (parseFloat(roundto) <= 0.0){
		errorStr+= `Round to nearest "${roundto}" must be positive\n`;
	}

	if (errorStr.length==0) {
		return false;
	} else {
		return errorStr.slice(0, errorStr.length-1);
	}
}

var n_players;
document.getElementById('calculate').onclick = () => {
	var results = document.getElementById('results');
	results.innerHTML = '';
	
	var errorStr = checkInput();
	if (errorStr) {
		var b = document.createElement('B');
		b.appendChild(document.createTextNode('Please fix the following errors:'));
		results.appendChild(b);
		results.appendChild(document.createElement('BR'));
		errorStr.split('\n').forEach(msg => {
			results.appendChild(document.createTextNode(msg));
			results.appendChild(document.createElement('BR'));
		});
	} else {
		updateNames();
		updateNets();
		updateRoundTo();
		n_players = netArr.length;
		var netArr_rounded = roundNetGains(netArr, round_to);
		var transactions = calcOptimalTransactions(netArr_rounded);
		results.innerHTML = '';
		transactions.forEach(trans => {
			results.appendChild(document.createTextNode(`${nameArr[trans[0]]} pays ${nameArr[trans[1]]} $${trans[2].toFixed(2)}`))
			results.appendChild(document.createElement('BR'));
		})
	}
}

function transactionsComparison(trans1, trans2) {
	if (trans1.length==0 && trans2.length==0) return true;

	// Compare # of transactions
	if (trans1.length < trans2.length) {
		return true;
	} else if (trans1.length > trans2.length) {
		return false;
	}

	// Count # transactions per player
	var counts1 = new NumArray(n_players).fill(0);
	var counts2 = new NumArray(n_players).fill(0);
	trans1.forEach(trans => {
		counts1[trans[0]]++;
		counts1[trans[1]]++;
	});
	trans2.forEach(trans => {
		counts2[trans[0]]++;
		counts2[trans[1]]++;
	});

	// Compare balance of # of transactions per player
	var std1 = counts1.std();
	var std2 = counts2.std();
	if (std1<std2) {
		return true;
	} else if (std1>std2) {
		return false;
	}

	// Store transactions amounts in arrays
	var amounts1 = new NumArray();
	var amounts2 = new NumArray();
	trans1.forEach(trans => amounts1.push(trans[2]));
	trans2.forEach(trans => amounts2.push(trans[2]));

	// Compare balance of transaction amounts
	return amounts1.std() < amounts2.std();
}

function calcOptimalTransactions(net_gains) {
	assert(Math.abs(net_gains.reduce((a,b) => a+b, 0))<EPS, 'Net gains must sum to 0');
	var obj = calcOptimalTransactionsAux(net_gains, []);

	return obj.transactions;
}

function calcOptimalTransactionsAux(net_gains, transactions) {
	var net_gains_all_zero = true;
	net_gains.forEach(ng => {
		if (Math.abs(ng)>EPS) net_gains_all_zero = false;
	});
	if (net_gains_all_zero) return {net_gains: net_gains, transactions: transactions};

	var transactions_opt = new Array(999).fill(0);
	var net_gains_opt = [...net_gains];

	for (let i=0; i<net_gains.length; i++) {
		for (let j=0; j<net_gains.length; j++) {	// TODO: j=i+1?
			if (net_gains[i]<-EPS && net_gains[j]>EPS) { // Player i pays player j
				var amount = Math.min(Math.abs(net_gains[i]), roundTo(Math.abs(net_gains[j]),2));
				var net_gains_ij = [...net_gains];
				net_gains_ij[i] += amount;
				net_gains_ij[j] -= amount;

				var transactions_ij = cloneTransArr(transactions);
				transactions_ij.push([i,j,amount]);

				var obj = calcOptimalTransactionsAux(net_gains_ij, transactions_ij);
				net_gains_ij = obj.net_gains;
				transactions_ij = obj.transactions;
				if (transactionsComparison(transactions_ij, transactions_opt)) {
					transactions_opt = transactions_ij;
					net_gains_opt = net_gains_ij;
				}
			}
		}
	}

	return {net_gains: net_gains_opt, transactions: transactions_opt};
}

function argmax(arr){
    return arr.indexOf(Math.max(...arr));
}
function argmin(arr){
    return arr.indexOf(Math.min(...arr));
}

function roundNetGains(net_gains, round_to){
	var net_gains_rounded = new NumArray(net_gains.length).fill(0);
	var rounding_errors = new NumArray(net_gains.length).fill(0);
	for(let i = 0; i<net_gains_rounded.length; i++){
		net_gains_rounded[i] = Math.round(net_gains[i]/round_to)*round_to;
		rounding_errors[i] = net_gains_rounded[i] - net_gains[i];
	}

	while (net_gains_rounded.sum() > EPS){
		var ind = argmax(rounding_errors);
		net_gains_rounded[ind] -= round_to;
		rounding_errors[ind] -= round_to;
	}

	while (net_gains_rounded.sum() < -EPS){
		var ind = argmin(rounding_errors);
		net_gains_rounded[ind] += round_to;
		rounding_errors[ind] += round_to;
	}

	return net_gains_rounded;
}

function assert(assertion, message) {
	if (!assertion) alert(message);
}

function cloneTransArr(transactions) {
	var arr = [];
	transactions.forEach(trans => arr.push([trans[0], trans[1], roundTo(trans[2],2)]));
	return arr;
}