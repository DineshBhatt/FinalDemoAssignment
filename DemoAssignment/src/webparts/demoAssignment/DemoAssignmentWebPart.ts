import { Version, Environment, EnvironmentType } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';
import * as JQuery from 'jquery';
import { SPComponentLoader } from '@microsoft/sp-loader';
import * as pnp from 'sp-pnp-js';
require('bootstrap');
import styles from './DemoAssignmentWebPart.module.scss';
import charts from 'chart.js';
import * as strings from 'DemoAssignmentWebPartStrings';
import { SPHttpClient, SPHttpClientResponse, HttpClientResponse } from '@microsoft/sp-http';
import { CurrentUser } from 'sp-pnp-js/lib/sharepoint/siteusers';
var LocationList = new Array();
var TotalVote = new Array();
var TotalVotePerLocation = new Array();
//getting the current useer already present or not
var userExist = false;
var userId;
var userLocation;
var ClientName;
export interface IDemoAssignmentWebPartProps {
  description: string;
  
}

export default class DemoAssignmentWebPart extends BaseClientSideWebPart<IDemoAssignmentWebPartProps> {
  public render(): void {
    SPComponentLoader.loadCss("https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css");
    this.domElement.innerHTML = `<div class="container" style="width: inherit;">
    <h1><center>Polling</center></h1>
      <div class="Location"></div>
      <a target="_blank" href="#"><button type="button" class="btn btn-success" style=" width: 110px; margin-left: 300px; margin-top: 55px"  href="#"> Submit </button>
      </a>
      <div id="chartContainer" style="height: 370px; width: 100%;">
        <canvas id="pieChart"></canvas>
      </div>
      </div>`;
      // i am getting the Location Title
      var Data;
      ClientName = this.context.pageContext.user.displayName;
      this.getLocationInforamtion();
      this.getTotalVote();
      JQuery(document).ready(function (){
       
      });
     
      function GetPieChart(){ 
        var ctxP:any = document.getElementById("pieChart");
        var cnt:any=ctxP.getContext('2d');
        var myPieChart = new charts(ctxP, {
            type: 'pie',
            data: {
                labels: LocationList,
                datasets: [
                    {
                       data: TotalVotePerLocation,
                       backgroundColor: ["#F7464A", "#46BFBD", "#FDB45C", "#949FB1"],
                       hoverBackgroundColor: ["#FF5A5E", "#5AD3D1", "#FFC870", "#A8B3C5"]
                    }
                ]
            },
            options: {
                responsive: true
            }
        });
 
      }

      JQuery(document).on('click','.btn-primary',function (){
        var a = $(this).attr("id");
        var ClickID = $(this);
        if(ClickID.hasClass('active')){
          $(".ClickedHere").prop('disabled', false);
          
          ClickID.removeClass('active');
        }else{
          $(".ClickedHere").prop('disabled', true);
          ClickID.prop('disabled', false).addClass("active");
        }
        
        Data = a.split(" ");
      });
      JQuery(document).on('click', '.btn-success', function(){
        
        if(Data==null){
          alert("Give vote first");
          GetPieChart();
        }else{
          if(userExist){
           
            UpdateTheData();
          }else{
            inserTheData();
          }
          alert(ClientName+ "already Voted for"+userLocation+" are you sure you want to vote again");
          GetPieChart();
          Data = null;
        }
      });
     function UpdateTheData(){
        
        pnp.sp.web.lists.getByTitle("Dinesh_voting").items.getById(userId).update({Title : Data[0], UserName: ClientName});
        
     }
     function inserTheData(){
      pnp.sp.web.lists.getByTitle("Dinesh_voting").items.add({Title : Data, UserName: ClientName})
        
      alert("Data inserted");
     }
      
    }
   
  getLocationInforamtion(){
      
    let LocVar:string ='';
    if(Environment.type===EnvironmentType.Local){
      this.domElement.querySelector('.Location').innerHTML = "no Location found";
    }else{
      this.context.spHttpClient.get(
        this.context.pageContext.web.absoluteUrl + "/_api/Web/Lists/getByTitle('DineshVotingLocation')/items?$select=Title,Image,ID,Locations", SPHttpClient.configurations.v1
      ).then((Respons : SPHttpClientResponse)=>{
        Respons.json().then((listsObjects: any)=>{
          listsObjects.value.forEach(element => {
            LocVar += `<div class='col-md-3'><img src="${element.Image}" alt="${element.Title}" style="width:100%; height:100px" /><h1>${element.Locations}</h1><button class='btn btn-primary ClickedHere' type="button" id="${element.Title} ${element.ID}"> Vote </button></div>`;
            LocationList.push(element.Title);
          });
          this.domElement.querySelector('.Location').innerHTML = LocVar ;
          
        });
      });
    }
  }
  getTotalVote(){
      
    let LocVar:string ='';
    if(Environment.type===EnvironmentType.Local){
      this.domElement.querySelector('.Location').innerHTML = "no Location found";
    }else{
      this.context.spHttpClient.get(
        this.context.pageContext.web.absoluteUrl + "/_api/Web/Lists/getByTitle('Dinesh_voting')/items?$select=Title,ID,UserName", SPHttpClient.configurations.v1
      ).then((respons : SPHttpClientResponse)=>{
        respons.json().then((listsObjects: any)=>{
          listsObjects.value.forEach(element => {
            TotalVote.push(element.Title, element.ID, element.UserName);
          });
          this.getTotalVotePerLocation();
        });
      });
    }
  }

  getTotalVotePerLocation(){
    var delhiTotalVote=0;
    var MumbaiTotalVote=0;
    var chennaiTotalVote=0;
    var HyderabadTotalVote=0;
    for (var i = 0; i < TotalVote.length; i=i+3) { 
      if(TotalVote[i]=="Delhi"){
        delhiTotalVote++;
      }
      if(TotalVote[i]=="Mumbai"){
        MumbaiTotalVote++;
      }
      if(TotalVote[i]=="Chennai"){
        chennaiTotalVote++;
      }
      if(TotalVote[i]=="Hyderabad"){
        HyderabadTotalVote++;
      }
      if(TotalVote[i+2]==ClientName){
        userExist = true;
        userId = TotalVote[i+1];
        userLocation = TotalVote[i];
      }
    }
    TotalVotePerLocation.push(delhiTotalVote);
    TotalVotePerLocation.push(MumbaiTotalVote);
    TotalVotePerLocation.push(chennaiTotalVote);
    TotalVotePerLocation.push(HyderabadTotalVote);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }
  
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
