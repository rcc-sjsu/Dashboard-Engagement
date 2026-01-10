
//API Wiring, fetch and recieve JSON

//according to analytics/dashboard (seed data)



export const fetchDashboardData = async () => {
    try{
        const response = await fetch("http://localhost:8000/analytics"); //wait for endpoint


        const data = await response.json();
        console.log("Data fetched");
        return data;

    } catch(error){   //placeholder
        console.log("Mock Data:")

       return (
         error
      )
    
  }
};