import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AbhaServicesService } from '../services/abha-services.service';
import { interval, map, Subscription, take } from 'rxjs';
import { jsPDF } from "jspdf";
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  @ViewChildren('box') boxes!: QueryList<ElementRef<HTMLInputElement>>;

  ngAfterViewInit() {
    this.boxes.changes.subscribe(() =>
      this.boxes.first?.nativeElement.focus()
    );
  }
  aadharNumber:any;
  resOtpMsg:any;
  countdown = 30;                 
  private ticker?: Subscription;  
  isCreateView: boolean = false;
  isShowOtp :boolean = false;
  accountExits:boolean = true;
  profileView: boolean = false;
  profileCard:boolean = false;
  isLoading :boolean = false;
  isUpdateLoading : boolean = false;
  name:any;
  abhaNumber:any;
  abhaAddress:any;
  mobile:any;
  gender:any;
  dateOfBirth:any;
  photoUrl:any;
  qrCodeUrl:any;
  abhaPDF:any;
  uniqueToken:any;
  email:any;
  otherDetails:any
  isUpdateMobile:boolean=false;
  isDeleteABHA : boolean = false;
  updatedMobileNumber:any;
  transactionId:any
  constructor(private fb: FormBuilder,
    private service:AbhaServicesService,
    private route:Router
  ) {
    this.uniqueToken = localStorage.getItem('token');
    this.getQrCode();
    //console.log(this.uniqueToken)
    this.getAccountDetails();
    setTimeout(()=>{
      this.accountExits=false;
      this.profileCard=true;
      this.otherDetails=true;
    },3000);
  }

  ngOnInit(){
  }
  otpForm: FormGroup = this.fb.group({
    otp: new FormControl('', [Validators.required, Validators.minLength(6),Validators.maxLength(6),Validators.pattern(/^\d{6}$/)
    ])
  });

  get otpCtrl() { return this.otpForm.get('otp') as FormControl; }

  handleInput(e: Event, idx: number) {
    const el = e.target as HTMLInputElement;
    const digit = el.value.replace(/[^0-9]/g, '');
    el.value = digit;

    const value = this.boxes.map(b => b.nativeElement.value).join('');
    this.otpCtrl.setValue(value);         
    this.otpCtrl.markAsTouched();

    if (digit && idx < 5) {
      this.boxes.get(idx + 1)!.nativeElement.focus();
    }
  }
  
  handleKeydown(e: KeyboardEvent, idx: number) {
    if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value && idx > 0) {
      setTimeout(() => this.boxes.get(idx - 1)!.nativeElement.focus());
    }
  }

  getQrCode(){
    this.service.getQrcode(this.uniqueToken).subscribe({
      next : (res)=>{
        //console.log(res);
        if(res.Status ==200){
          this.qrCodeUrl = res?.qr_code_base64;
        }
      },
      error:(err)=>{
        console.log("In Error");
      }
    })
  }
  getAccountDetails(){
    this.service.getAccountDetails(this.uniqueToken).subscribe({
      next : (res)=>{
        this.abhaNumber = res?.Response?.ABHANumber
        this.name = res?.Response?.firstName+" "+res?.Response?.middleName+" "+res?.Response?.lastName;
        this.dateOfBirth = res?.Response?.dayOfBirth+"-"+res?.Response?.monthOfBirth+"-"+res?.Response?.yearOfBirth;
        this.abhaAddress = res?.Response?.preferredAbhaAddress;
        this.mobile = res?.Response?.mobile;
        this.gender = res?.Response?.gender
        this.photoUrl = res?.Response?.profilePhoto;
        this.photoUrl = 'data:image/png;base64,' + this.photoUrl;
        if(this.gender=='M'){
          this.gender = "Male";
        }
        else if(this.gender=='F'){
          this.gender = "Female";
        }
        console.log(res);
      }
    })
  }

  downloadFile() {
    this.isLoading = true;
    this.service.downloadPDF(this.uniqueToken).subscribe({
     next:(res)=>{
      if(res.status==200){
        this.abhaPDF = res.abhaCard;
        this.base64ToPdf(this.abhaPDF);
        this.isLoading = false
      }
     }
    })
  }  
  base64ToPdf(base64Image: string) {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const img = new Image();
    img.src = base64Image;
    img.onload = function () {
      const imgWidth = 250;
      const imgHeight = 160;
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;
      pdf.addImage(img, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save('Abha-Card.pdf');
    };
  }
  maskDetails(value:any, start = 2, end = 2, maskChar = '*') {
    if (!value || value.length <= start + end) return value;
    const maskedLength = value.length - start - end;
    return value.substring(0, start) + maskChar.repeat(maskedLength) + value.substring(value.length - end);
  }

  selectMobileUpdate(){
    this.otherDetails = false;
    this.isUpdateMobile = true;
    this.updatedMobileNumber = this.mobile;
  }
  selectDeleteAbha(){
    this.isDeleteABHA = true;
    let data = {
      "token": this.uniqueToken,
      "abha-number": this.abhaNumber
    }
    this.service.getOtpForDeleteABHA(data).subscribe({
      next: (res:any)=>{
        if(res.status==200){
          this.transactionId = res.Response.txnId;
          this.resOtpMsg = res.Response.message;
          this.otherDetails = false;
          this.isShowOtp = true;
          this.startOtpTimer();
        }
      }
    })
  }
  updateMobileNumber() {
   // this.isUpdateLoading = true
   this.isUpdateMobile = false;
   this.isShowOtp = true;
    let data = {
      "token": this.uniqueToken,
      "mobile": this.updatedMobileNumber
    }
    this.service.updateMobileNumber(data).subscribe({
      next: (res) => {
        console.log(res);
        if(res.status==200){
          this.transactionId = res.Response.txnId;
          this.resOtpMsg = res.Response.message;
          this.isUpdateLoading = false;
          this.isUpdateMobile = false;
          this.isShowOtp = true;
          this.startOtpTimer();
        }
      },
      error: (err) => {
        switch (err.status) {
          case 400:
            alert("Invalid Credentials!!");
            this.isUpdateLoading = false;
            break;
        }
      }
    })
  }
  private startOtpTimer(): void {
    this.ticker?.unsubscribe();
    this.countdown = 30;
    this.ticker = interval(1000).pipe(
      take(30),                  
      map(i => 29 - i)           
    ).subscribe(sec => this.countdown = sec);
  }
  verifyUpdateMobileNumber(){
    this.isUpdateLoading = true;
    if(this.isDeleteABHA){
      this.deleteAbhaVerify();
    }
    else{
      let data = {
        "token": this.uniqueToken,
        "txnId": this.transactionId,
        "otp": this.otpForm.get('otp')?.value
      }
      this.service.verifyOtpForUpdateMobile(data).subscribe({
        next : (res:any) => {
          console.log(res);
          if(res.status==200){
            this.isUpdateLoading = false;
            this.transactionId = res.Response.txnId;
            this.isShowOtp = false;
            this.otpForm.reset();
            this.otherDetails = true;
            this.getAccountDetails();
          }
          
        }
      })
    }
  }
  resendOtp(event:Event){

  }
  deleteAbhaVerify(){
    let data = {
      "token":this.uniqueToken,
      "txnId":this.transactionId,
      "otp":this.otpForm.get('otp')?.value
    }
    this.service.deleteAbhaVerify(data).subscribe({
      next: (res:any)=>{
        if(res.status==200){
          alert("Account Deleted Successfully!!");
          this.route.navigate(["/"]);
          localStorage.clear();
        }
      },
      error:(err)=>{
        switch(err.status){
          case 400:
            alert("Invalid Creadentials");
            break;
        }
      }
    })
  }
}
