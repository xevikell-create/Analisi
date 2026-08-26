import json, time, urllib.request
from pathlib import Path

CIK={
 'AAPL':'0000320193','MSFT':'0000789019','GOOGL':'0001652044','AMZN':'0001018724','NVDA':'0001045810','AMD':'0000002488','META':'0001326801','AVGO':'0001730168','JPM':'0000019617','V':'0001403161','BRK.B':'0001067983','KO':'0000021344','JNJ':'0000200406','NEE':'0000753308','FSLR':'0001274494'
}
TAGS={
 'revenue':['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet'],
 'netIncome':['NetIncomeLoss'],
 'equity':['StockholdersEquity'],
 'assets':['Assets'],
 'liabilities':['Liabilities'],
 'operatingIncome':['OperatingIncomeLoss'],
 'cfo':['NetCashProvidedByUsedInOperatingActivities'],
 'capex':['PaymentsToAcquirePropertyPlantAndEquipment'],
 'eps':['EarningsPerShareDiluted']
}

def get(cik):
 url=f'https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json'
 req=urllib.request.Request(url,headers={'User-Agent':'AnalisiRadar/1.0 github-actions[bot]@users.noreply.github.com'})
 with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)

def annual(fact):
 units=next(iter(fact.get('units',{}).values()),[])
 vals=[]
 for x in units:
  if x.get('fp')=='FY' and x.get('form') in ('10-K','20-F') and x.get('val') is not None:
   vals.append(x)
 vals.sort(key=lambda x:x.get('end',''),reverse=True)
 out=[]; seen=set()
 for x in vals:
  y=x.get('fy')
  if y and y not in seen:seen.add(y);out.append(x)
 return out

def pick(facts,names):
 for n in names:
  f=facts.get('facts',{}).get('us-gaap',{}).get(n)
  if f:
   a=annual(f)
   if a:return a
 return []

def main():
 p=Path('radar-data.json'); data=json.loads(p.read_text())
 for ticker,cik in CIK.items():
  try:
   j=get(cik); facts=j.get('facts',{}).get('us-gaap',{})
   series={k:pick(j,v) for k,v in TAGS.items()}
   a=data['assets'].get(ticker,{'ticker':ticker}); latest=lambda k: series[k][0]['val'] if series[k] else None
   prev=lambda k: series[k][1]['val'] if len(series[k])>1 else None
   rev,prevrev=latest('revenue'),prev('revenue'); ni=latest('netIncome'); eq=latest('equity'); assets=latest('assets'); liab=latest('liabilities'); op=latest('operatingIncome'); cfo=latest('cfo'); capex=latest('capex'); eps=latest('eps')
   if rev: a['revenue']=rev
   if rev and prevrev: a['revenueGrowth']=(rev/prevrev-1)*100
   if ni and rev: a['operatingMargin']=(op/rev*100) if op else None; a['netMargin']=ni/rev*100
   if ni and eq: a['roe']=ni/eq*100
   if cfo is not None and capex is not None and rev: a['fcfMargin']=(cfo-abs(capex))/rev*100
   if eps is not None: a['eps']=eps
   if eps is not None and a.get('price') is not None and eps>0: a['pe']=a['price']/eps
   a['completeness']=max(int(a.get('completeness',0)),70)
   a['sources']=[{'type':'primary','name':'SEC EDGAR XBRL'}]
   a['fundamentalsUpdatedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
   data['assets'][ticker]=a
  except Exception as e: data['assets'].setdefault(ticker,{'ticker':ticker})['secError']=str(e)
 data['updatedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime());p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
