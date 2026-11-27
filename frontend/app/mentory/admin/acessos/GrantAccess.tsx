'use client';
import {useState} from 'react';
import GrantMentory from './GrantMentory';
import {createManualLicenseAction} from './actions';
export default function GrantAccess({email='',userId='',products,presets}:{email?:string;userId?:string;products:{value:string;label:string}[];presets:{value:string;label:string}[]}){
 const [product,setProduct]=useState('mentory');
 return <div className="form-grid"><label>Produto<select value={product} onChange={e=>setProduct(e.target.value)}><option value="mentory">Ped Expert Mentory</option>{products.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></label>{product==='mentory'?<GrantMentory email={email}/>:<form action={createManualLicenseAction} className="form-grid"><input type="hidden" name="clinicalProduct" value={product}/>{userId?<input type="hidden" name="userId" value={userId}/>:<label>E-mail<input type="email" name="userEmail" required/></label>}<label>Vigência<select name="preset" defaultValue="365d">{presets.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></label><label>Motivo<input name="reason" required minLength={8}/></label><label>Senha atual<input name="stepUpPassword" type="password" required autoComplete="current-password"/></label><button className="btn btn-primary">Conceder acesso</button></form>}</div>;
}
