import { addEmpLeave, getEmpLeavedata, addClaim, getEmpClaimdata, getExpenseItemList, getProjectList, getEmpAttendanceData, getEmpHolidayData, empCheckData, processClaim, getClaimApproverList, getfiletotext, getAppointeeList, processAppointee, getEmployeeRequestList, getEmployeeRequestCategory, processEmployeeRequest, getEventtList, getEventResponse, processEventRes, getTrainingModuleData, getEmpTrainingListData, processEmpTraining } from "../services/ConstantServies";
import { authAxios, authAxiosFilePost, authAxiosPost } from "./HttpMethod";

export function getEmpLeave(leave_type , emp_id, year) {
    let data = {};
    if (leave_type ){
        data['leave_type '] = leave_type;
    }
    if (emp_id){
        data['emp_id'] = emp_id;
    }
    if (year){
        data['year'] = year;
    }
  
    return authAxios(getEmpLeavedata, data)
  }
  
  export function postEmpLeave(leave_type) {
    let data = {};
    if (leave_type) {
      data['leave_data'] = leave_type;
    }
    return authAxiosPost(addEmpLeave, data)
  
  }

  export function postClaim(claim_data) {
    let data = {};
    if (claim_data) {
      data = claim_data;
    }
    return authAxiosFilePost(addClaim, claim_data)
  }

  export function postClaimAction(claim_type) {
    let data = {};
    if (claim_type) {
      data['claim_data'] = claim_type;
    }
    return authAxiosPost(processClaim, data)
  
  }

  export function getClaimApprover() { 
    let data = {};
    return authAxios(getClaimApproverList)
  }

  export function getEmpClaim(res) {
    let data = {
      'call_mode':res
    };
    
    return authAxios(getEmpClaimdata, data)
  }

  export function getExpenseItem() { 
    return authAxios(getExpenseItemList)
  }


  export function getExpenseProjectList() { 
    return authAxios(getProjectList)
  }

  export function getEmpAttendance(res) {
    let data = {
      'emp_id':res.emp_id,
      'month':res.month,
      'year': res.year
    };
    return authAxios(getEmpAttendanceData, data)
  }

  export function getEmpHoliday(res) {
    let data = {
      'year': res.year
    };
    return authAxios(getEmpHolidayData, data)
  }

  export function postCheckIn(checkin_data) {
    let data = {};
    if (checkin_data) {
      data['attendance_data'] = checkin_data;
      // data = checkin_data;
    }
    console.log("Data Passed===",data)
    return authAxiosPost(empCheckData, data)
  }


  export function imagetotext(Uri) {
    let data = {};
    data = Uri
    return authAxiosFilePost(getfiletotext, data);
  }

  // export function getAppointee() { 
  //   return authAxios(getAppointeeList)
  // }

  export function postAppointee(res) {
    let data = {};
    if (res) {
      data['emp_data'] = res;
    }
    return authAxiosPost(processAppointee, data)
  
  }

  export function getEmployeeRequest() { 
    // let data = {
    //   'emp_id':"EMP-001",
    //   'request_sub_type':"Technical Support",
    //   'request_type': "H"
    // };
    return authAxios(getEmployeeRequestList)
  }

  export function getRequestCategory() { 
    return authAxios(getEmployeeRequestCategory)
  }

  export function postEmpRequest(request_data) {
    // let data = {};
    // if (claim_data) {
    //   data = claim_data;
    // }
    // console.log('Data to be sent:', request_data);
    return authAxiosFilePost(processEmployeeRequest, request_data)
  }

  export function getEvents(params = {}) {
    const data = {
      emp_id: params.emp_id || "",
      event_type: params.event_type || "",
      date_range: params.date_range || 'ALL'
    };
    return authAxios(getEventtList, data);
  }

  export function getEventsResponse(params = {}) {
    const data = {
      event_id: '2',
      event_type: params.event_type || "",
      date_range: params.date_range || 'ALL'
    };
    return authAxios(getEventResponse, data);
  }

  export function processEventResponse(event_data) {
    let data = {};
    if (event_data) {
      data = event_data;
    }
    return authAxiosFilePost(processEventRes, data)
  }

    export async function getTrainingData() {
    // console.log("Data to be sent--->", data);
    // const url = await getTrainingModuleData();
    return authAxios(getTrainingModuleData);
}

  export async function getEmpTrainingList(response) {
    let data ={
      'emp_id': response
    }
    console.log("Data to be sent--->", data);
    // const url = await getEmpTrainingListData();
    return authAxios(getEmpTrainingListData, data);
}

export async function EnrollEmpTraining(res) {
    let data = {};
    if (res) {
      data = res;
    }
    console.log("At data to be pass--",data)
    // const url = await processEmpTraining();
    return authAxiosFilePost(processEmpTraining, data);
  }