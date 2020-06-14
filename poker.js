data = [
	{
		name: 'rsandz',
		net: -30
	},
	{
		name: 'rupumped',
		net: 111.50
	},
	{
		name: 'ironpiggy',
		net: 0
	},
	{
		name: 'jguggenh',
		net: -10.5
	},
	{
		name: 'Shikari',
		net: -50
	},
	{
		name: 'Gab',
		net: -60
	},
	{
		name: 'bobman1234',
		net: 5.5
	},
	{
		name: 'All-in-Fili',
		net: 33.5
	},
];

var net_gains = [];
data.forEach(player => net_gains.push(player.net));
var n_players = net_gains.length;

function transactionsComparison(trans1, trans2) {
	if (trans1.length==0 && trans2.length==0) return true;

	// Compare # of transactions
	if (trans1.length < trans2.length) {
		return true;
	} else if (trans1.length > trans2.length) {
		return false;
	}

	// Count # transactions per player
	var counts1 = new Array(n_players).fill(0);
	var counts2 = new Array(n_players).fill(0);
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
	var amounts1 = [];
	var amounts2 = [];
	trans1.forEach(trans => amounts1.push(trans[2]));
	trans2.forEach(trans => amounts2.push(trans[2]));

	// Compare balance of transaction amounts
	return amounts1.std() < amounts2.std();
}

function calcOptimalTransactions(net_gains) {
	assert(Math.abs(net_gains.reduce((a,b) => a+b, 0))==0, 'Net gains must sum to 0');
	var obj = calcOptimalTransactionsAux(net_gains, []);

	return obj.transactions;
}

function calcOptimalTransactionsAux(net_gains, transactions) {
	var net_gains_all_zero = true;
	net_gains.forEach(ng => {
		if (ng>0) net_gains_all_zero = false;
	});
	if (net_gains_all_zero) return {net_gains: net_gains, transactions: transactions};

	var transactions_opt = new Array(999).fill(0);
	var net_gains_opt = [...net_gains];

	for (let i=0; i<net_gains.length; i++) {
		for (let j=0; j<net_gains.length; j++) {	// TODO: j=i+1?
			if (net_gains[i]<0 && net_gains[j]>0) { // Player i pays player j
				var amount = Math.min(Math.abs(net_gains[i]), Math.abs(net_gains[j]));
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

var transactions = calcOptimalTransactions(net_gains);
console.log(transactions)
console.log('done')


function assert(assertion, message) {
	if (!assertion) throw message;
}

function cloneTransArr(transactions) {
	var arr = [];
	transactions.forEach(trans => arr.push([trans[0], trans[1], trans[2]]));
	return arr;
}