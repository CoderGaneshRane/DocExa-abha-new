import { AfterViewInit, Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AbhaServicesService } from '../services/abha-services.service';
import { interval, map, Subscription, take } from 'rxjs';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {

  @ViewChildren('box') boxes!: QueryList<ElementRef<HTMLInputElement>>;

  ngAfterViewInit() {
    this.boxes.changes.subscribe(() =>
      this.boxes.first?.nativeElement.focus()
    );
  }

  transactionId:any
  uniqueToken:any;
  aadharNumber: any;
  resOtpMsg: any;
  countdown = 30;
  private ticker?: Subscription;  
  isCreateView: boolean = true;
  showOtp = false;
  accountExits: boolean = false;
  profileView: boolean = false;
  profileCard: boolean = false;
  isLoading = false;
  name: any;
  abhaNumber: any;
  aadharPart1: string = '';
  aadharPart2: string = '';
  aadharPart3: string = '';
  mobile:string='';
  isLoginByMobile:boolean=false;
  isCreateAbhaAddress:boolean=false;
  abhaAddress = '';
showSuggestions = false;
suggestions = ['raneganesh20040808', 'raneganesh20040806', 'user.alpha', 'ganesh.rane'];
filteredSuggestions: string[] = [];


  constructor(private fb: FormBuilder,
    private service: AbhaServicesService,
    private route: Router
  ) { 
    this.filteredSuggestions = [...this.suggestions]
  }

  otpForm: FormGroup = this.fb.group({
    otp: new FormControl('', [Validators.required, Validators.minLength(6),Validators.maxLength(6),Validators.pattern(/^\d{6}$/)
    ]),
    phone: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern('^[0-9]{10}$')])
  });

  switchToMobileOrAadhar(){
    this.isLoginByMobile = !this.isLoginByMobile;
  }
  getFullAadhaarNumber(): string {
    return (this.aadharPart1 || '') + (this.aadharPart2 || '') + (this.aadharPart3 || '');
  }

  moveToNext(event: any, nextInput: any) {
    if (event.target.value.length === 4) {
      nextInput.focus();
    }
  }

  moveToPrev(event: any, prevInput: any) {
    if (event.key === 'Backspace' && event.target.value.length === 0 && prevInput) {
      prevInput.focus();
    }
  }
  
  isAadhaarComplete(): boolean {
    return this.aadharPart1.length === 4 && this.aadharPart2.length === 4 && this.aadharPart3.length === 4;
  }

  get otpCtrl() { return this.otpForm.get('otp') as FormControl; }

  onMobileSubmit(){
    this.isLoading = true;
    console.log(this.mobile);
    this.otpForm.get('phone')?.setValue(this.mobile);
    let data={
      "mobile-number":this.mobile
    }
    this.service.sendMobileOtp(data).subscribe({
      next: (res:any)=>{
        console.log(res);
        if(res.status==200){
          this.resOtpMsg = res.Response.message;
          this.transactionId = res.Response.txnId;
          this.isLoading = false;
          this.isCreateView = false;
          this.showOtp = true;
          this.startOtpTimer();
        }
      },
      error: (err)=>{
        switch (err.status) {
          case 422:
            alert("Something went Wrong!!");
            break;
          case 429:
            alert("Please try after some time!!");
            break;
          case 400:
            alert("Invalid Mobile Number");
            break;
          case 401:
            alert("Invalid Credentials"); 
            break;  
        }
      }
    })
  }
  onAadhaarSubmit(aNumber: any) {
    this.isLoading = true;
    console.log(aNumber);
    this.aadharNumber = aNumber;
    let data = {
      "loginId": this.aadharNumber
    }
    this.service.sendAadharOtp(data).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res.status == 200) {
          this.isLoading = false;
          this.resOtpMsg = res.ResponseJSON.message;
          this.transactionId = res.ResponseJSON.txnId;
          this.isCreateView = false;
          this.showOtp = true;
          this.startOtpTimer();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error("Error Occured : ", err)

        switch (err.status) {
          case 422:
            alert("Something went Wrong!!");
            break;
          case 429:
            alert("Please try after some time!!");
            break;
          case 404:
            alert("Please enter valid Aadhar");
            break;
          case 400:
            alert("Please enter valid Details");
            this.aadharPart1='';
            this.aadharPart2='';
            this.aadharPart3=''; 
            break;
          case 401:
            alert("Please enter valid Details");
            this.aadharPart1='';
            this.aadharPart2='';
            this.aadharPart3='';  
            break;  
        }
      }
    })
  }

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

  onOtpSubmit() {
    if (this.isLoginByMobile) {
      this.otpByMobile();
    }
    else {
      this.isLoading = true;
      if (this.otpForm.valid) {
        let data = {
          "mobile": this.otpForm.get('phone')?.value,
          "otp": this.otpForm.get('otp')?.value,
          "txnId":this.transactionId
        }
        this.ticker?.unsubscribe();
        this.countdown = 0;
        this.service.verifyOtp(data).subscribe({
          next: (res: any) => {
            console.log(res);
            if (res.Status == 200 && res.Response.message == "This account already exist") {
              this.isLoading = false;
              this.uniqueToken = res?.Response?.tokens?.token;
              localStorage.setItem('token',this.uniqueToken);
              this.route.navigate(['/profile']);
              this.showOtp = false;
              this.isCreateView = true;
            }
            else if(res.Status == 200 && res.Response.message == "Account created successfully"){
              this.getAbhaAddressSuggestion();
              this.isLoading = false;
              this.uniqueToken = res?.Response?.tokens?.token;
              localStorage.setItem('token',this.uniqueToken);
              //navigate
              this.showOtp = false;
              this.isCreateAbhaAddress = true;
            }
          },
          error: (err: any) => {
            this.isLoading = false;
            console.error("Error Occured : ", err)
            switch (err.status) {
              case 422:
                alert("Please Enter Valid OTP!!");
                break;
              case 429:
                alert("Please try after some time!!");
                break;
              case 404:
                alert("Please enter valid Aadhar");
                break;
            }
          }
        });
      }
    }
  }
  otpByMobile(){
    this.isLoading=true;
    let data = {
      "txnId":this.transactionId,
      "otp": this.otpForm.get('otp')?.value
    }
    this.service.verifyMobileOtp(data).subscribe({
      next: (res)=>{
        console.log("Mobile Login Response: ",res);
        if(res.status == 200 && res.Response.message=="OTP verified successfully"){
          this.isLoading = false;
          this.uniqueToken = res.Response.token;
          localStorage.setItem('token',this.uniqueToken);
          this.transactionId = res.Response.txnId;
          this.route.navigate(['/profile']);
        }
      },
      error: (err)=>{
        switch(err.status){
          case 404:
            alert("Please Enter Valid Mobile Number");
            break;
          case 422:
            alert("Something Went Wrong!!");
            break;  
        }
      }
    })
  }

  resendOtp(e: Event) {
    console.log(this.aadharNumber);
    let data={
      "loginId":this.aadharNumber
    }
    this.service.sendAadharOtp(data).subscribe({
      next: (res) => {
        if(res.status==200){
          this.startOtpTimer();
        }
      },
      error:(err)=>{
        switch (err.status) {
          case 422:
            alert("Something went Wrong!!");
            break;
          case 429:
            alert("Please try after some time!!");
            this.aadharPart1='';
            this.aadharPart2='';
            this.aadharPart3='';
            break;
          case 404:
            alert("Please enter valid Aadhar");
            this.aadharPart1='';
            this.aadharPart2='';
            this.aadharPart3='';
            break;
          case 400:
            alert("Please enter valid Details");
            this.aadharPart1='';
            this.aadharPart2='';
            this.aadharPart3=''; 
            break;
          case 401:
            alert("Please enter valid Details");
            this.aadharPart1='';
            this.aadharPart2='';
            this.aadharPart3='';  
            break;  
        }
      }
    })
    
    console.log('Resend OTP');
  }

  private startOtpTimer(): void {
    this.ticker?.unsubscribe();
    this.countdown = 30;
    this.ticker = interval(1000).pipe(
      take(30),                  
      map(i => 29 - i)           
    ).subscribe(sec => this.countdown = sec);
  }
  onInputChange(): void {
    const query = this.abhaAddress.toLowerCase().trim();
    if (query === '') {
      this.filteredSuggestions = [...this.suggestions];
    } else {
      this.filteredSuggestions = this.suggestions.filter(
        s => s.toLowerCase().includes(query)
      );
    }
  }

  getAbhaAddressSuggestion(){
    this.service.getAbhaAddressSuggestions(this.transactionId).subscribe({
      next: (res:any) => {
        if(res.status==200){
          console.log(res);
          this.suggestions = res.Response.abhaAddressList;
          this.filteredSuggestions = [...this.suggestions];
        }
       
      },
      error: (err)=>{
        console.error(err);
      }
    })
  }
  
  selectSuggestion(suggestion: string) {
    this.abhaAddress = suggestion;
    this.filteredSuggestions = [];
  }

  createAbhaAddress(){
    this.isLoading = true;
    let data = {
      "txnId":this.transactionId,
      "abhaAddress":this.abhaAddress
    }
    this.service.createNewAbhaAddress(data).subscribe({
      next: (res) => {
        console.log(res);
        this.route.navigate(['/profile']);
      },
      error: (err) => {
        switch(err.status){
          case 400:
            alert("Invalid Credentials!!");
            this.isLoading = false;
            break;
        }
      }
    })
  }
}
