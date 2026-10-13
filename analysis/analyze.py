"""Analysis of REAL per-trial data only. Usage: python analyze.py ../data/raw_trials.csv [metric] [tier] [records]"""
import sys, itertools, numpy as np, pandas as pd
from scipy import stats
f=sys.argv[1]; metric=sys.argv[2] if len(sys.argv)>2 else 'lcp_ms'
df=pd.read_csv(f)
if len(sys.argv)>3: df=df[df.tier==sys.argv[3]]
if len(sys.argv)>4: df=df[df.records==int(sys.argv[4])]
groups={k:g[metric].dropna().values for k,g in df.groupby('framework')}
print({k:(len(v),round(v.mean(),1),round(v.std(ddof=1),1)) for k,v in groups.items()})
for k,v in groups.items(): print('Shapiro',k,stats.shapiro(v))
F,p=stats.f_oneway(*groups.values()); N=sum(map(len,groups.values()))
print(f'ANOVA F({len(groups)-1},{N-len(groups)}) = {F:.2f}, p = {p:.3g}')
H,pk=stats.kruskal(*groups.values()); print(f'Kruskal-Wallis H = {H:.2f}, p = {pk:.3g}')
def hedges(a,b):
    sp=np.sqrt(((len(a)-1)*a.var(ddof=1)+(len(b)-1)*b.var(ddof=1))/(len(a)+len(b)-2))
    return (a.mean()-b.mean())/sp*(1-3/(4*(len(a)+len(b))-9))
for a,b in itertools.combinations(groups,2): print(f"Hedges g {a} vs {b}: {hedges(groups[a],groups[b]):.2f}")
# scalability: TTI (or chosen metric) vs log10(records), whole data set
full=pd.read_csv(f)
for fw,g in full.groupby('framework'):
    m=g.groupby('records')[metric].mean()
    if len(m)>2:
        r=stats.linregress(np.log10(m.index.values),m.values); print(fw,'slope',round(r.slope,1),'R2',round(r.rvalue**2,3))
