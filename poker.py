import csv
import numpy as np

names = []
net_gains = []

eps = 1e-6
round_to = 0.5 

with open('chip_history.csv', 'r') as csvfile:
    reader = csv.reader(csvfile, delimiter=',', quotechar='|')
    next(reader) # Skip header rows
    next(reader)

    for row in reader:
        if len(row) == 0:
            break
        name, buy_in, buy_out, net, on_table, contact = row
        if on_table == '': on_table = 0.0
        buy_in, buy_out, net, on_table = float(buy_in), float(buy_out), float(net), float(on_table)

        net_gain = (buy_out + on_table - buy_in)/100.0

        names.append(name)
        net_gains.append(net_gain)

n_players = len(net_gains)

def transactionsComparison(trans1, trans2):
    '''
    trans1: list of transactions. Each transation is a list of 3 values [sender index, recipient index, amount]
    trans2: list of transactions. Each transation is a list of 3 values [sender index, recipient index, amount]

    Returns True if trans1 is more optimal than trans2 and False otherwise
    1. Prefer fewer transactions
    2. Prefer balanced # of transactions per player
    3. Prefer balanced transaction amounts
    '''

    # Compare # of transactions
    if len(trans1) < len(trans2): 
        return True
    elif len(trans1) > len(trans2):
        return False

    # Count number of transactions per player
    counts1 = np.zeros(n_players)
    counts2 = np.zeros(n_players)
    for trans in trans1:
        counts1[trans[0]] += 1
        counts1[trans[1]] += 1
    for trans in trans2:
        counts2[trans[0]] += 1
        counts2[trans[1]] += 1

    # Compare balance of # of transactions per player
    std1 = np.std(counts1)
    std2 = np.std(counts2)
    if std1 < std2:
        return True
    elif std1 > std2:
        return False

    # Store transaction amounts in arrays 
    amounts1 = np.array(trans1)[:,2]
    amounts2 = np.array(trans2)[:,2]

    # Compare balance of transaction amounts
    return np.std(amounts1) < np.std(amounts2)

def calcOptimalTransactions(net_gains):
    assert abs(sum(net_gains)) < eps, "Net gains must sum to 0"
    net_gains, transactions = calcOptimalTransactionsAux(net_gains, [])

    return transactions

def calcOptimalTransactionsAux(net_gains, transactions):
    if all(abs(ng) < eps for ng in net_gains):
        return net_gains, transactions

    transactions_opt = [None]*999
    net_gains_opt = list(net_gains)

    for i in range(len(net_gains)):
        for j in range(len(net_gains)):
            if net_gains[i] < -eps and net_gains[j] > eps: # Player i pays player j
                amount = min(abs(net_gains[i]), abs(net_gains[j]))
                net_gains_ij = list(net_gains)
                net_gains_ij[i] += amount
                net_gains_ij[j] -= amount

                transactions_ij = list(transactions)
                transactions_ij.append([i,j,amount])

                net_gains_ij, transactions_ij = calcOptimalTransactionsAux(net_gains_ij, transactions_ij)
                if transactionsComparison(transactions_ij, transactions_opt): 
                    transactions_opt = list(transactions_ij)
                    net_gains_opt = list(net_gains_ij)

    return net_gains_opt, transactions_opt

def argmax(iterable):
    return max(enumerate(iterable), key=lambda x: x[1])[0]
def argmin(iterable):
    return min(enumerate(iterable), key=lambda x: x[1])[0]

def roundNetGains(net_gains, round_to):
    rounding_errors = [0]*len(net_gains)

    for i in range(len(net_gains)):
        ng_rounded = round(net_gains[i]/round_to)*round_to
        rounding_errors[i] = ng_rounded - net_gains[i]
        net_gains[i] = ng_rounded

    while sum(net_gains) > eps:
        ind = argmax(rounding_errors)
        net_gains[ind] -= round_to
        rounding_errors[ind] -= round_to

    while sum(net_gains) < -eps:
        ind = argmin(rounding_errors)
        net_gains[ind] += round_to
        rounding_errors[ind] += round_to

if round_to is not None:
    roundNetGains(net_gains, round_to)

transactions = calcOptimalTransactions(net_gains)
print("==================================================")
print("Net Gain Summary")
print("==================================================")

for i, net_gain in enumerate(net_gains):
    print(f"{names[i]} nets {'+' if net_gain > 0 else '-'}${abs(net_gain):.2f}")
print("==================================================")
print("Settling Summary")
print("==================================================")
for trans in transactions:
    print(f"{names[trans[0]]} pays {names[trans[1]]} ${trans[2]:.2f}")






