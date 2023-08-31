import { Component } from '@angular/core';
import { IDataType } from 'src/app/interfaces/import-data.interface';
import { Papa } from 'ngx-papaparse';
import * as moment from 'moment';
import { MTuple } from 'src/app/Types/tuple.type';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {

  resultColumnsInfo: string[] = ['Employee ID #1', 'Employee ID #2', 'Project ID', 'Days worked'];
  initialLoadColumnsInfo: string[] = ['Employee ID', 'Project ID', 'DateFrom', 'DateTo'];
  selectedFileName: string = 'No file chosen';
  unsuportedFile: boolean = false;
  inputTableData: string[][] = [];
  resultData: (string | number)[][] = [];

  constructor(private papa: Papa) {}

  onFileSelected(event: Event): void {
    this.unsuportedFile = false;
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];

    this.selectedFileName = file ? file.name : 'No file chosen';
    if (!file || file.type !== 'text/csv') {
      this.unsuportedFile = true;
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result as string;
      this.papa.parse(fileContent,{
        complete: (result) => {
            this.inputTableData = this.sanityzeCsvData(result.data);
        }
      });
    };
    reader.readAsText(file);
  }

  sanityzeCsvData(data: Array<string[]>): Array<string[]> {
    return data.filter(x => x.length > 1 && !isNaN(+x[0]));
  }

  getResults(): void {
    const allEmpByProject = this.inputTableData.reduce((a: IDataType, c: string[]) => {
      const [ employeeId, projectId, start, end ] = c;
      if(a && a[projectId] && a[projectId][employeeId]) {
        return {...a, [projectId]: { ...a[projectId], [employeeId]: a[projectId][employeeId] + this.getWorkedDays(start, end)}}
      }
      return {...a, [projectId]: {...a[projectId], [employeeId]: this.getWorkedDays(start, end)}}
 
    }, {});
    console.log(allEmpByProject)
    this.resultData = Object.entries(allEmpByProject).filter(item => {
      // filter projects with less than 2 employees worked on
      return Object.keys(item[1]).length > 1;
    })
    .map((x) => {
      const [projectId, hoursByEmp] = x;
      const res = Object.entries(hoursByEmp).sort((a: MTuple, b: MTuple) => b[1] - a[1]);
      return [res[0][0], res[1][0], projectId, res[0][1] + res[1][1]]
    })
    .sort((a: (string | number)[], b: (string | number)[]) => +b[3] - +a[3]);
    
  }

  getWorkedDays(start: string, end: string): number { 
    const isEndNull = !end || end.toLowerCase() === 'null';  
    const startDate = moment(start).utc();
    const endDate = !isEndNull ? moment(end).utc() : moment().utc();
    return endDate.diff(startDate, 'hours');
  }

}

