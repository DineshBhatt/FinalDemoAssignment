import { Version, Environment, EnvironmentType } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';
import * as JQuery from 'jquery';
import { SPComponentLoader } from '@microsoft/sp-loader';
import * as pnp from 'sp-pnp-js';
require('bootstrap');
import charts from 'chart.js';
import * as strings from 'DemoAssignmentWebPartStrings';
import { SPHttpClient, SPHttpClientResponse, HttpClientResponse } from '@microsoft/sp-http';
var LocationList = new Array();
var TotalVote = new Array();
var TotalVotePerLocation = new Array();
//getting the current useer already present or not
var userExist = false;
var userId;
var userLocation;
var ClientName;
var contexthttp;
var mainContext;
export interface IDemoAssignmentWebPartProps {
  description: string;
}
export default class DemoAssignmentWebPart extends BaseClientSideWebPart<IDemoAssignmentWebPartProps> {
  public render(): void {
    SPComponentLoader.loadCss("https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css");
    this.domElement.innerHTML = `<div class="container" style="width: inherit;">
    <h1><center>Polling</center></h1>
      <div class="Location"></div>
      <button type="button" class="btn btn-success" style=" width: 110px; margin-left: 300px; margin-top: 55px"> Submit </button>
      
      <div id="chartContainer" style="height: 370px; width: 100%;">
        <canvas id="pieChart"></canvas>
      </div>
      </div>`;
      contexthttp=this.context.spHttpClient;
      mainContext = this.context.pageContext.web.absoluteUrl;
      this.TheDemoPageMethod(this.getTotalVote, this.getTotalLocation)
       
    }

    private TheDemoPageMethod(callDemoLocation, callDemoVote)
    {
      var Data;
      ClientName = this.context.pageContext.user.displayName;
      callDemoVote();
      //this.getTotalLocation();
      this.getTotalVote();  
      this.getLocationInforamtion();
      JQuery(document).ready(function (){
        GetPieChart();
      });
      function GetPieChart(){ 
        alert("pie chart");
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
        Data = a;
      });
      JQuery(document).on('click', '.btn-success', function(){
        
        if(Data==null){
          alert("Give vote first");
          GetPieChart();
        }else{
          if(userExist){
            alert(ClientName+ "already Voted for"+userLocation+" are you sure you want to vote again");
            UpdateTheData();
            
          }else{
            inserTheData();
            
          }
          Data = null;
        }
      });
     function UpdateTheData(){
      pnp.sp.web.lists.getByTitle("Dinesh_voting").items.getById(userId).update({Title : Data, UserName: ClientName}).then(()=> {
        callDemoLocation();
        callDemoVote();
        GetPieChart();
      });
      alert("data updated");
     }
     function inserTheData(){
      pnp.sp.web.lists.getByTitle("Dinesh_voting").items.add({Title : Data, UserName: ClientName}).then( ()=> {
        callDemoLocation(), 
        callDemoVote();
        GetPieChart();
      });
      alert("Data inserted");
     }
    }

 public getLocationInforamtion(){alert("dispaly the data and button");
    let LocVar:string ='';
    if(Environment.type===EnvironmentType.Local){
      this.domElement.querySelector('.Location').innerHTML = "no Location found";
    }else{
      contexthttp.get(
      mainContext  + "/_api/Web/Lists/getByTitle('DineshVotingLocation')/items?$select=Title,Image,ID,Locations", SPHttpClient.configurations.v1
      ).then((Respons : SPHttpClientResponse)=>{
        Respons.json().then((listsObjects: any)=>{
          listsObjects.value.forEach(element => {
            LocVar += `<div class='col-md-3'><img src="${element.Image}" alt="${element.Title}" style="width:100%; height:100px" /><h1>${element.Locations}</h1><button class='btn btn-primary ClickedHere' type="button" id="${element.Title}"> Vote </button></div>`;
            
          });
          this.domElement.querySelector('.Location').innerHTML = LocVar ;
          if(userExist){
            $(".ClickedHere").prop('disabled', true);
            $("#"+userLocation).prop('disabled', false).addClass("active");
          }
        });
      });
    }
  }
 public  getTotalLocation(){
    alert("total location");
    if(Environment.type===EnvironmentType.Local){
      this.domElement.querySelector('.Location').innerHTML = "no Location found";
    }else{
      contexthttp.get(
        mainContext + "/_api/Web/Lists/getByTitle('DineshVotingLocation')/items?$select=Title,Image,ID,Locations", SPHttpClient.configurations.v1
      ).then((Respons : SPHttpClientResponse)=>{
        Respons.json().then((listsObjects: any)=>{
          LocationList = [];
          listsObjects.value.forEach(element => {
            LocationList.push(element.Title);
          });
        });
      });
    }
  }
  public getTotalVote()
  {
    alert(" total vote")
   
    let LocVar:string ='';
    
    if(Environment.type===EnvironmentType.Local){
      this.domElement.querySelector('.Location').innerHTML = "no Location found";
    }else{
      contexthttp.get(
        mainContext + "/_api/Web/Lists/getByTitle('Dinesh_voting')/items?$select=Title,ID,UserName", SPHttpClient.configurations.v1
      ).then((respons : SPHttpClientResponse)=>{
        respons.json().then((listsObjects: any)=>{
          TotalVote = [];
          listsObjects.value.forEach(element => {
            TotalVote.push(element.Title, element.ID, element.UserName);
          });
          TotalVotePerLocation = [];
          var delhiTotalVote=0;
          var MumbaiTotalVote=0;
          var chennaiTotalVote=0;
          var HyderabadTotalVote=0;
          for (var i = 0; i < TotalVote.length; i=i+3) { 
            if(TotalVote[i]==LocationList[0]){
              delhiTotalVote++;
            }
            if(TotalVote[i]==LocationList[1]){
              MumbaiTotalVote++;
            }
            if(TotalVote[i]==LocationList[2]){
              chennaiTotalVote++;
            }
            if(TotalVote[i]==LocationList[3]){
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
        });
      });
    }
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
