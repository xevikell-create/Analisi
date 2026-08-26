import json, time, urllib.request
from pathlib import Path
CIK={'AAPL':'0000320193','MSFT':'0000789019','GOOGL':'0001652044','AMZN':'0001018724','NVDA':'0001045810','AMD':'0000002488','META':'0001326801','AVGO':'0001730168','JPM':'0000019617','V':'0001403161','BRK.B':'0001067983','KO':'0000021344','JNJ':'0000200406','NEE':'0000753308','FSLR':'0001274494'}
TAGS={'revenue':['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet'],'netIncome':['NetIncomeLoss'],'equity':['StockholdersEquity'],'assets':['Assets'],'liabilities':['Liabilities'],'operatingIncome':['OperatingIncomeLoss'],'cfo':['NetCashProvidedByUsedInOperatingActivities'],'capex':['PaymentsToAcquirePropertyPlantAndEquipment'],'eps':['EarningsPerShareDiluted'],'debtLong':['LongTermDebtNoncurrent'],'debtCurrent':['ShortTermBorrowings','LongTermDebtCurrent'],'da':['DepreciationDepletionAndAmortization']}
def get(cik):
 req=urllib.request.Request(f'https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json',headers={'User-Agent':'AnalisiRadar/1.0 github-actions[bot]@users.noreply.github.com'})
 with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)
def annual(fact):
 units=next(iter(fact.get('units',{}).values()),[]);vals=[x for x in units if x.get('fp')=='FY' and x.get('form') in ('10-K','20-F') and x.get('val') is not None];vals.sort(key=lambda x:x.get('end',''),reverse=True);out=[];seen=set()
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
 p=Path('radar-data.json');data=json.loads(p.read_text())
 for ticker,cik in CIK.items():
  try:
   j=get(cik);series={k:pick(j,v) for k,v in TAGS.items()};a=data['assets'].get(ticker,{'ticker':ticker});latest=lambda k:series[k][0]['val'] if series[k] else None;prev=lambda k:series[k][1]['val'] if len(series[k])>1 else None
   rev,pr=latest('revenue'),prev('revenue');ni,eq,assets,liab=latest('netIncome'),latest('equity'),latest('assets'),latest('liabilities');op,cfo,capex=latest('operatingIncome'),latest('cfo'),latest('capex');eps,peps=latest('eps'),prev('eps');debt=(latest('debtLong') or 0)+(latest('debtCurrent') or 0);da=latest('da') or 0
   if rev:a['revenue']=rev
   if rev and pr:a['revenueGrowth']=(rev/pr-1)*100
   if ni and rev:a['netMargin']=ni/rev*100
   if op and rev:a['operatingMargin']=op/rev*100
   if ni and eq:a['roe']=ni/eq*100
   if op and da and assets and liab:a['roic']=op/(assets-liab)*100 if assets>liab else None
   if cfo is not None and capex is not None and rev:a['fcfMargin']=(cfo-abs(capex))/rev*100
   if eps is not None:a['eps']=eps
   if eps is not None and peps not in (None,0):a['epsGrowth']=(eps/peps-1)*100
   if eps and a.get('price') is not None and eps>0:a['pe']=a['price']/eps
   if debt and op and da and (op+da)>0:a['debtToEbitda']=debt/(op+da)
   a['completeness']=max(int(a.get('completeness',0)),82);a['sources']=[{'type':'primary','name':'SEC EDGAR XBRL'}];a['fundamentalsUpdatedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime());data['assets'][ticker]=a
  except Exception as e:data['assets'].setdefault(ticker,{'ticker':ticker})['secError']=str(e)
 data['updatedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime());p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
