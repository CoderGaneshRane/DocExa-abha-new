import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './abha/login-page/login-page.component';
import { ProfileComponent } from './abha/profile/profile.component';

const routes: Routes = [{
  path:'', component:LoginPageComponent
},
{
  path:'profile', component:ProfileComponent
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
