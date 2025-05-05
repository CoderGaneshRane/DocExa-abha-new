import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environmet } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AbhaServicesService {
  private apiUrl = `${environmet.docexaABHA}`
  constructor(private http:HttpClient) {}

  sendAadharOtp(aadharNumber:any):Observable<any>{
    return this.http.post(this.apiUrl+'enrollment/request/otp',aadharNumber);
  }
  sendMobileOtp(mobileNumber:any){
    return this.http.post(this.apiUrl+'verify/abha/mobile-number/request/otp',mobileNumber);
  }
  verifyOtp(data:any):Observable<any>{
    return this.http.post(this.apiUrl+'enrollment/enrol/byAadhaar', data);
  }
  verifyMobileOtp(data:any):Observable<any>{
    return this.http.post(this.apiUrl+'verify/abha/mobile-number/otp', data);
  }
  getAccountDetails(token:any):Observable<any>{
    const headers = new HttpHeaders({
      'token': token  
    });
    return this.http.get(this.apiUrl+'enroll/profile/account',{headers});
  }
  getQrcode(token:any):Observable<any>{
    const headers = new HttpHeaders({
      'token': token  
    });
    return this.http.get(this.apiUrl+'profile/account/qr-code/to-hex',{headers});
  }
  downloadPDF(token:any):Observable<any>{
    const headers = new HttpHeaders({
      'token': token  
    });
    return this.http.get(this.apiUrl+'profile/account/abha-card-base-64',{headers});
  }

  getAbhaAddressSuggestions(transactionId:any):Observable<any>{
    const headers = new HttpHeaders({
      'txnId': transactionId  
    });
    return this.http.get(this.apiUrl+'enrollment/enrol/suggestion',{headers});
  }

  createNewAbhaAddress(data:any):Observable<any>{
    return this.http.post(this.apiUrl+'enrollment/enrol/abha-address',data);
  }
  updateMobileNumber(data:any):Observable<any>{
    return this.http.post(this.apiUrl+'profile/account/update-mobile/request/otp', data);
  }
  verifyOtpForUpdateMobile(data:any):Observable<any>{
    return this.http.post(this.apiUrl+'profile/account/update-mobile/verify/otp', data);
  }
  getOtpForDeleteABHA(data:any):Observable<any>{
    return this.http.post(this.apiUrl+'profile/account/delete/send/otp', data);
  }
  deleteAbhaVerify(data:any):Observable<any>{
    return this.http.post(this.apiUrl+'profile/account/delete/verify/otp', data);
  }
  updateEmailOtpRequest(data:any):Observable<any>{
    return this.http.post(this.apiUrl+'profile/account/update-email/request/otp', data);
  }
  updateEmailVerifyOtp(data:any):Observable<any>{
    return this.http.post(this.apiUrl+'profile/account/update-email/verify/otp', data);
  }
}

