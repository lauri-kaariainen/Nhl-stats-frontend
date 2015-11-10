self.onmessage = function(e) {
    //first call will be slow
    if(!self.rawData && self.loadingComplete === undefined){
      //console.log("rawdata and loadingcompelete undefined");
      loadData();
      setTimeout(function(){self.onmessage(e)},100);
      return;
    }
    else if(!self.rawData && self.loadingComplete === false){
      //console.log("rawdata and loadingcompelete false");
      setTimeout(function(){self.onmessage(e)},100);
      return;
    }


    if(e.data["byTeamPlayerAmount"]){
      getResultListByPlayerAmountAndPost(e.data["byTeamPlayerAmount"],self.rawData);

    }
    if(e.data["resultList"]){
      getResultListAndPost(self.rawData);
    }

    if(e.data["all"]){
      getResultListAndPost(self.rawData);
      getTeamMemberResultListAndPost(self.rawData);
      //getHistoryListAndPost(self.rawData);
      return;

    }
    if(e.data["newHistoryListString"]){
      //load new data
	  
	  //debug 
	  var historyListStringDebugStartTime = new Date().getTime();
	  
      loadData(getHistoryListStringAndPost(self.rawData));

    }
    if(e.data["teamMemberStatsList"]){
      getTeamMemberResultListAndPost(self.rawData);

    }



    function loadData(callBack){
      //AJAX CALL
      self.loadingComplete = false;

  		{
  			var client = new XMLHttpRequest();
  			client.open('GET', 'ajax/results/?timestamp='+new Date().getTime(), true);
  			client.onreadystatechange = function() {

          //self.postMessage("client.readyState:"+client.readyState + " client.status:"+client.status);
  				if(client.readyState===4 && client.status === 200){  //this means the transaction is wholly done

  			  	//self.postMessage("debug:file loaded: "+client.responseText.length);
              //////console.log("file loaded: "+client.responseText.length);
            //self.postMessage("debug:file loaded");
              self.rawData = JSON.parse(client.responseText);
              self.loadingComplete = true;
              if(callBack)
                callBack();
  				}

  			}
        //self.postMessage("debug:starting to load a file");
  			client.send();
  		}
    }


    function getHistoryListStringAndPost(data){
	    self.postMessage({"type":"historyListString","data":handleDataToMakeHistoryListStringWithHTMLLineBreaks(data)});
	}

    function getResultListAndPost(data){

        ////console.log(handleDataToMakeListForResultList(data));
        self.postMessage({"type":"resultList","data":handleDataToMakeListForResultList(data)});
    }


    function getTeamMemberResultListAndPost(data){
        ////console.log(handleDataToMakeListForTeamMemberResultList(data));
        self.postMessage({"type":"teamMemberList","data":handleDataToMakeListForTeamMemberResultList(data)});

    }

    function getResultListByPlayerAmountAndPost(amount,data){
        //console.log(amount);
        ////console.log(handleDataToMakeListForResultListByTeamPlayerAmount(amount,data));
        if(amount === "withTeammates")
          self.postMessage({"type":"resultListByPlayerAmount","data":handleDataToMakeListForResultListByGamesWithTeammates(data)});
        else
          self.postMessage({"type":"resultListByPlayerAmount","data":handleDataToMakeListForResultListByTeamPlayerAmount(amount,data)});
    }



    function handleDataToMakeHistoryListStringWithHTMLLineBreaks(data){
	  var retString = "";
	  var totalTimeCreatingDate = 0;
	  var totalTime = 0;
	  for(var i = data.length - 1; i > 0;i--){
		var startTime = new Date().getTime();
        
		retString += "<br/>";
		var localString = (new Date(data[i].timestamp))/*.toLocaleString();*/
		totalTimeCreatingDate += new Date().getTime()-startTime
		retString += localString+"--- "+data[i].home + " vs. "+data[i].away +": "+data[i].result;
        totalTime += new Date().getTime()-startTime
		
	}
	  console.debug("time creating date: "+totalTimeCreatingDate+"ms. total time: "+totalTime+"ms.");
	  console.debug("handleDataToMakeHistoryListStringWithHTMLLineBreaks before return: " +(new Date().getTime()-historyListStringDebugStartTime));
      return retString;

    }

    function handleDataToMakeHistoryListArray(data){
      var returnObject = [];
      for(var i = 0; i < data.length;i++){
        returnObject.push({"date":new Date(data[i].timestamp),"home":data[i].home,"away":data[i].away,"result":data[i].result});
      }
      return returnObject;

    }


    /**
    * returns the results from every match
    *
    */
    function handleDataToMakeListForResultList(data){
      var returnObject = {};
      for(var i = 0; i < data.length;i++){
        //$('#history').prepend("<br/>"+(new Date(data[i].timestamp)).toLocaleString()+"--- "+data[i].home + " vs. "+data[i].away +": "+data[i].result);
        var homeNames = data[i].home.split(' ');
        //console.log(i+":"+data[i].home);
        var awayNames = data[i].away.split(' ');
        for(var k = 0; k < homeNames.length;k++){
          var result = returnObject[homeNames[k]] ? returnObject[homeNames[k]] : {};
          result["name"] = homeNames[k];
          if(result["plus-minus"] === undefined) result["plus-minus"] = 0;
          if(result["games"] === undefined) result["games"] = 0;
          if(result["wins"] === undefined) result["wins"] = 0;
          if(result["loses"] === undefined) result["loses"] = 0;
          if(result["winning %"] === undefined) result["winning %"] = 0;
          if(result["goals for team"] === undefined) result["goals for team"] = 0;
          if(result["goals per game for team"] === undefined) result["goals per game for team"] = 0;
          if(result["goals against team"] === undefined) result["goals against team"] = 0;
          result["plus-minus"] += data[i].homegoals-data[i].awaygoals;
          result["games"] += 1;
          result["wins"] += (data[i].homegoals-data[i].awaygoals) > 0 ? 1 : 0;
          result["loses"] += (data[i].homegoals-data[i].awaygoals) < 0 ? 1 : 0;
          result["winning %"] = (100* result["wins"] / result["games"]).toFixed(2);
          result["goals for team"] += data[i].homegoals;
          //console.log(k+":"+result["name"]+": data[i].homegoals:" +data[i].homegoals);
          //console.log(k+":"+result["name"]+": result['goals for team']:"+result["goals for team"]);
          result["goals per game for team"] = (result["goals for team"] / result["games"]).toFixed(2);
          result["goals against team"] += data[i].awaygoals;
          result["goals per game against team"] = (result["goals against team"] / result["games"]).toFixed(2);
          returnObject[homeNames[k]] = result;
        }
        for(var k = 0; k < awayNames.length;k++){
          var result = returnObject[awayNames[k]] ? returnObject[awayNames[k]] : {};
          result["name"] = awayNames[k];
          if(result["plus-minus"] === undefined) result["plus-minus"] = 0;
          if(result["games"] === undefined) result["games"] = 0;
          if(result["wins"] === undefined) result["wins"] = 0;
          if(result["loses"] === undefined) result["loses"] = 0;
          if(result["winning %"] === undefined) result["winning %"] = 0;
          if(result["goals for team"] === undefined) result["goals for team"] = 0;
          if(result["goals per game for team"] === undefined) result["goals per game for team"] = 0;
          if(result["goals against team"] === undefined) result["goals against team"] = 0;
          result["plus-minus"] += data[i].awaygoals-data[i].homegoals;
          result["games"] += 1;
          result["wins"] += (data[i].awaygoals-data[i].homegoals) > 0 ? 1 : 0;
          result["loses"] += (data[i].awaygoals-data[i].homegoals) < 0 ? 1 : 0;
          result["winning %"] = (100 * result["wins"] / result["games"]).toFixed(2);
          result["goals for team"] += data[i].awaygoals;
          result["goals per game for team"] = (result["goals for team"] / result["games"]).toFixed(2);
          result["goals against team"] += data[i].homegoals;
          result["goals per game against team"] = (result["goals against team"] / result["games"]).toFixed(2);
          returnObject[awayNames[k]] = result;
        }
      }
      return returnObject;
    }


    function handleDataToMakeListForTeamMemberResultList(data){
      //console.log(data);
      var resultList = {};
      for(var i = 0; i < data.length;i++){
        var homeNames = data[i].home.split(' ');
        var awayNames = data[i].away.split(' ');
        for(var j = 0;j < homeNames.length;j++){
          if(resultList[homeNames[j]] === undefined) { resultList[homeNames[j]] = {}; resultList[homeNames[j]].teammembers = {};}
          var homeNamesWithoutThisPlayer = homeNames.filter(function(name) {return name !== homeNames[j]});
          resultList[homeNames[j]].name = homeNames[j];
          if(homeNamesWithoutThisPlayer.length === 0){
            if(resultList[homeNames[j]].teammembers[["alone"]] === undefined){
                resultList[homeNames[j]].teammembers["alone"] = {};
                resultList[homeNames[j]].teammembers["alone"].goals = 0;
                resultList[homeNames[j]].teammembers["alone"].name = "alone";
                resultList[homeNames[j]].teammembers["alone"].games = 0;
                resultList[homeNames[j]].teammembers["alone"].goalsAgainst = 0;
                resultList[homeNames[j]].teammembers["alone"].wongames = 0;
                resultList[homeNames[j]].teammembers["alone"].lostgames = 0;
                resultList[homeNames[j]].teammembers["alone"].winningperc = 0;
            }
            resultList[homeNames[j]].teammembers["alone"].goals += data[i].homegoals;
              resultList[homeNames[j]].teammembers["alone"].games += 1;
              resultList[homeNames[j]].teammembers["alone"].goalsAgainst += data[i].awaygoals;
              resultList[homeNames[j]].teammembers["alone"].wongames += (data[i].homegoals > data[i].awaygoals) ? 1 : 0;
              resultList[homeNames[j]].teammembers["alone"].lostgames = resultList[homeNames[j]].teammembers["alone"].games - resultList[homeNames[j]].teammembers["alone"].wongames;
              resultList[homeNames[j]].teammembers["alone"].winningperc = resultList[homeNames[j]].teammembers["alone"].wongames / resultList[homeNames[j]].teammembers["alone"].games;

          }
          else
            for(var k = 0;k < homeNamesWithoutThisPlayer.length;k++){

              if(resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]] === undefined){
                resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]] = {};
                resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].name = homeNamesWithoutThisPlayer[k];
                resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].goals = 0;
                resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].games = 0;
                resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].goalsAgainst = 0;
                resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].wongames = 0;
                resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].lostgames = 0;
                resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].winningperc = 0;
              }
              resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].goals += data[i].homegoals;
              resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].games += 1;
              resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].goalsAgainst += data[i].awaygoals;
              resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].wongames += (data[i].homegoals > data[i].awaygoals) ? 1 : 0;
              resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].lostgames = resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].games - resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].wongames;
              resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].winningperc = resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].wongames / resultList[homeNames[j]].teammembers[homeNamesWithoutThisPlayer[k]].games;
            }
        }

        for(var j = 0;j < awayNames.length;j++){
          if(resultList[awayNames[j]] === undefined) { resultList[awayNames[j]] = {}; resultList[awayNames[j]].teammembers = {};}
          var awayNamesWithoutThisPlayer = awayNames.filter(function(name) {return name !== awayNames[j]});
          resultList[awayNames[j]].name = awayNames[j];
          if(awayNamesWithoutThisPlayer.length === 0){
            if(resultList[awayNames[j]].teammembers[["alone"]] === undefined){
                resultList[awayNames[j]].teammembers["alone"] = {};
                resultList[awayNames[j]].teammembers["alone"].goals = 0;
                resultList[awayNames[j]].teammembers["alone"].name = "alone";
                resultList[awayNames[j]].teammembers["alone"].games = 0;
                resultList[awayNames[j]].teammembers["alone"].goalsAgainst = 0;
                resultList[awayNames[j]].teammembers["alone"].wongames = 0;
                resultList[awayNames[j]].teammembers["alone"].lostgames = 0;
                resultList[awayNames[j]].teammembers["alone"].winningperc = 0;
            }
            resultList[awayNames[j]].teammembers["alone"].goals += data[i].awaygoals;
              resultList[awayNames[j]].teammembers["alone"].games += 1;
              resultList[awayNames[j]].teammembers["alone"].goalsAgainst += data[i].awaygoals;
              resultList[awayNames[j]].teammembers["alone"].wongames += (data[i].awaygoals > data[i].homegoals) ? 1 : 0;
              resultList[awayNames[j]].teammembers["alone"].lostgames = resultList[awayNames[j]].teammembers["alone"].games - resultList[awayNames[j]].teammembers["alone"].wongames;
              resultList[awayNames[j]].teammembers["alone"].winningperc = resultList[awayNames[j]].teammembers["alone"].wongames / resultList[awayNames[j]].teammembers["alone"].games;

          }
          else
            for(var k = 0;k < awayNamesWithoutThisPlayer.length;k++){

              if(resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]] === undefined){
                resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]] = {};
                resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].name = awayNamesWithoutThisPlayer[k];
                resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].goals = 0;
                resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].games = 0;
                resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].goalsAgainst = 0;
                resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].wongames = 0;
                resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].lostgames = 0;
                resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].winningperc = 0;
              }
              resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].goals += data[i].awaygoals;
              resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].games += 1;
              resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].goalsAgainst += data[i].awaygoals;
              resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].wongames += (data[i].awaygoals > data[i].homegoals) ? 1 : 0;
              resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].lostgames = resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].games - resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].wongames;
              resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].winningperc = resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].wongames / resultList[awayNames[j]].teammembers[awayNamesWithoutThisPlayer[k]].games;
            }
        }


      }
      //sort out resultList's teammembers according to winningperc:
      for(var i in resultList){
        var teammemberResultArray = [];
        var obj = {"name":i,"teammembers": []};
        for(var j in resultList[i].teammembers){

          obj.teammembers.push(resultList[i].teammembers[j]);
        }
        obj.teammembers.sort(function(a,b){return (parseFloat(a.winningperc) < parseFloat(b.winningperc)) ? 1 : -1;});
        teammemberResultArray = obj;

        //console.log(teammemberResultArray);
        resultList[i] = teammemberResultArray;
      }
      return resultList;
    }

    /*
    * returns players' results from matches where there were more than one player playing
    *
    */
    function handleDataToMakeListForResultListByGamesWithTeammates(data){
      var returnObject = {};
      for(var i = 2;i < 7;i++){
        returnObject = sumResultListObject(returnObject,handleDataToMakeListForResultListByTeamPlayerAmount(i,data));
      }
      //console.log(returnObject);
      return returnObject;



      function sumResultListObject(resultList1,resultList2){

        for(var a in resultList2){
          if(resultList2.hasOwnProperty(a)){
            if(resultList1[a]){
              for(var b in resultList1[a]){
                if(b === "games" || b === "wins" || b === "loses" || b === "goals for team" || b === "goals against team") {
                  resultList1[a][b] += resultList2[a][b];
                }
              }
            }
            else{
              resultList1[a] = resultList2[a];
            }
          }
          resultList1[a]["plus-minus"] = resultList1[a]["goals for team"]-resultList1[a]["goals against team"];
          resultList1[a]["winning %"] = (100* resultList1[a]["wins"] / resultList1[a]["games"]).toFixed(2);
          resultList1[a]["goals per game for team"] = (resultList1[a]["goals for team"] / resultList1[a]["games"]).toFixed(2);
          resultList1[a]["goals per game against team"] = (resultList1[a]["goals against team"] / resultList1[a]["games"]).toFixed(2);
        }

        return resultList1;
      }

    }



    /*
    * returns players' results from matches where there were playersInTeam amount of teammates in total
    *
    */
    function handleDataToMakeListForResultListByTeamPlayerAmount(playersInTeam,data){
      var returnObject = {};
      for(var i = 0; i < data.length;i++){

        var homeNames = data[i].home.split(' ');
        var awayNames = data[i].away.split(' ');
        if(homeNames.length === playersInTeam){
          for(var k = 0; k < homeNames.length;k++){
            var result = returnObject[homeNames[k]] ? returnObject[homeNames[k]] : {};
            result["name"] = homeNames[k];
            if(result["plus-minus"] === undefined) result["plus-minus"] = 0;
            if(result["games"] === undefined) result["games"] = 0;
            if(result["wins"] === undefined) result["wins"] = 0;
            if(result["loses"] === undefined) result["loses"] = 0;
            if(result["winning %"] === undefined) result["winning %"] = 0;
            if(result["goals for team"] === undefined) result["goals for team"] = 0;
            if(result["goals per game for team"] === undefined) result["goals per game for team"] = 0;
            if(result["goals against team"] === undefined) result["goals against team"] = 0;
            result["plus-minus"] += data[i].homegoals-data[i].awaygoals;
            result["games"] += 1;
            result["wins"] += (data[i].homegoals-data[i].awaygoals) > 0 ? 1 : 0;
            result["loses"] += (data[i].homegoals-data[i].awaygoals) < 0 ? 1 : 0;
            result["winning %"] = (100* result["wins"] / result["games"]).toFixed(2);
            result["goals for team"] += data[i].homegoals;
            //console.log(k+":"+result["name"]+": data[i].homegoals:" +data[i].homegoals);
            //console.log(k+":"+result["name"]+": result['goals for team']:"+result["goals for team"]);
            result["goals per game for team"] = (result["goals for team"] / result["games"]).toFixed(2);
            result["goals against team"] += data[i].awaygoals;
            result["goals per game against team"] = (result["goals against team"] / result["games"]).toFixed(2);
            returnObject[homeNames[k]] = result;
          }
        }
        if(awayNames.length === playersInTeam){
          for(var k = 0; k < awayNames.length;k++){
            var result = returnObject[awayNames[k]] ? returnObject[awayNames[k]] : {};
            result["name"] = awayNames[k];
            if(result["plus-minus"] === undefined) result["plus-minus"] = 0;
            if(result["games"] === undefined) result["games"] = 0;
            if(result["wins"] === undefined) result["wins"] = 0;
            if(result["loses"] === undefined) result["loses"] = 0;
            if(result["winning %"] === undefined) result["winning %"] = 0;
            if(result["goals for team"] === undefined) result["goals for team"] = 0;
            if(result["goals per game for team"] === undefined) result["goals per game for team"] = 0;
            if(result["goals against team"] === undefined) result["goals against team"] = 0;
            result["plus-minus"] += data[i].awaygoals-data[i].homegoals;
            result["games"] += 1;
            result["wins"] += (data[i].awaygoals-data[i].homegoals) > 0 ? 1 : 0;
            result["loses"] += (data[i].awaygoals-data[i].homegoals) < 0 ? 1 : 0;
            result["winning %"] = (100 * result["wins"] / result["games"]).toFixed(2);
            result["goals for team"] += data[i].awaygoals;
            result["goals per game for team"] = (result["goals for team"] / result["games"]).toFixed(2);
            result["goals against team"] += data[i].homegoals;
            result["goals per game against team"] = (result["goals against team"] / result["games"]).toFixed(2);
            returnObject[awayNames[k]] = result;
          }
        }
      }
      return returnObject;


    }


}
