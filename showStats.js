
	function ShowStats(){


		{

				var userList = undefined;


				var debugDiv = document.createElement('div');
				debugDiv.style.position = "absolute";
				debugDiv.style.backgroundColor = "white";
				debugDiv.style.fontSize = "3em"; 
				debugDiv.style.top = "0px"; 
				debugDiv.id ="debugDiv"
				debugDiv.style.display = "none";
				$('body').append(debugDiv);

				var worker = new Worker("dbWorker.js");

				worker.onerror = function(error){
					alert("error! "+error.message);
				}

				var debugHistoryListStringWorkerTimerStart;

				worker.onmessage = function(e) {
					$('#debugDiv')[0].innerHTML += "worker returned: " +e.data.type +"<br/>";
					if(e.data.type === "resultList"){
						populateResultList(e.data.data);
					}
					else if(e.data.type === "teamMemberList"){
						// console.log("teammemberListResults:")
						// console.log(e.data.data);
						populateTeamMemberInformation(e.data.data);
					}
					else if(e.data.type === "historyListString"){
						// console.log("teammemberListResults:")
						//console.log(e.data.data);
						$('#debugDiv')[0].innerHTML += 
							"historyliststring took (in worker): " +
							(new Date().getTime()-debugHistoryListStringWorkerTimerStart)+
							"<br/>";
						populateHistoryWithString(e.data.data);
					}
					else if(e.data.type === "resultListByPlayerAmount"){
						// console.log("teammemberListResults:")
						//console.log(e.data.data);
						populateResultList(e.data.data);
					}


				}
				//initial datafetch
				//worker.postMessage({"all":true});
				changeAmountOfTeamPlayers();
				worker.postMessage({"teamMemberStatsList":true});
		}








		function changeAmountOfTeamPlayers(){
		//console.log($('#teamPlayersAmountSelect').val());
		//console.log(parseInt($('#teamPlayersAmountSelect').val()))
			if(parseInt($('#teamPlayersAmountSelect').val()).toString() !== "NaN")
				worker.postMessage({"byTeamPlayerAmount":(parseInt($('#teamPlayersAmountSelect').val()))});
			else if($('#teamPlayersAmountSelect').val() === "withTeammates"){
				worker.postMessage({"byTeamPlayerAmount":"withTeammates"});
			}
			else
				worker.postMessage({"resultList":true});
		}

		ShowStats.changeAmountOfTeamPlayers = changeAmountOfTeamPlayers;

		ShowStats.populateHistory = function populateHistory(){
			console.log($('#history')[0].style.display);
			if($('#history')[0].style.display === "none"){
				worker.postMessage({"newHistoryListString":true});
				debugHistoryListStringWorkerTimerStart = new Date().getTime();
			}
		}





		function populateHistoryWithString(result){
			
			var debugStartTime = new Date().getTime();
			var FifteenGamesAsString = result.split("<br/>").slice(0,15).join('<br/>')+"<br/>";
			$('#history')[0].innerHTML = FifteenGamesAsString;
			var button = document.createElement('button');
			button.id = "historyShowMoreButton";
			button.innerHTML = "show more..."
			button.style.padding = "0";
			button.style.marginTop = "0";
			button.style.fontSize = "2em";

			button.onclick = function(){
				debugStartTime = new Date().getTime();
				this.parentElement.removeChild(this);
				$('#history').html(result);
				debugDiv.innerHTML += "after setting "+result.split('br').length+" elems: "+(new Date().getTime()-debugStartTime)+" <br/>"
			
			};
			$('#history')[0].appendChild(button);

		}


		function populateHistoryWithArray(resultArray){
			//console.log(resultList);
			$('#history').html("");
			var newDiv = document.createElement('div');
			for(var i = 0;i < resultArray.length;i++){
				$(newDiv).prepend("<br/>"+(resultArray[i].date).toLocaleString()+"--- "+resultArray[i].home + " vs. "+resultArray[i].away +": "+resultArray[i].result);
			}
			$('#history')[0].appendChild(newDiv);
		}



		function populateTeamMemberInformation(resultList){
			//console.log(resultList);
			for(var i in resultList){
				var elem = document.createElement('li');
				elem.className = 'teammemberLi';
				elem.appendChild(document.createTextNode(i + ": "));
				var percentage = document.createElement('span');


				for(var j = 0;j < resultList[i].teammembers.length;j++){
					elem.appendChild(document.createTextNode(resultList[i].teammembers[j].name + " - "));
					var percentage = document.createElement('span');
					percentage.appendChild(document.createTextNode((resultList[i].teammembers[j].winningperc*100).toFixed(2) +
																	"% out of "+
																	resultList[i].teammembers[j].games+" games"));
					percentage.style.display = "none";
					elem.appendChild(percentage);
				}

				$('#teammemberResultUl')[0].appendChild(elem);
				//console.log(i);
			}
			//IOS Safari doesn't know about :hover without onclicks on elem
			$('.teammemberLi').on('click',function(e){/*console.log("moi");*/ });
		}


		function populateResultList(objectList){


			//
			//make the new List.js or edit the old one

			//have to change to object to an array from 0....n for List.js
			console.log(objectList["lauri"]);



			var array = [];
			for(var unit in objectList){
					array.push(objectList[unit]);
			}


			//make links for header from obj's properties
			if($('#headerList').html() === ""){
				for (var key in array[0]){


					var headli = document.createElement('span');
					headli.setAttribute('class',"topic"+key + " " + "sort");
					headli.setAttribute('data-sort',key);
					headli.appendChild(document.createTextNode(key));

					document.getElementById("headerList").appendChild(headli);
				}
			}
			var listOfKeys = [];
			var listFieldString = "<li>";
			for(var field in array[0]){
				listOfKeys.push(field);
				listFieldString += "<span class='"+field+"'></span>";
			}
			listFieldString += "</li>";
			//console.log(array);
			//console.log("listOfKeys:" +listOfKeys);
			//console.log("listFieldString:"+listFieldString);

			var options = {
			  valueNames: listOfKeys,
			  item: listFieldString
			};
			if(userList === undefined){
				userList = new List('resultUl', options, array);
			}
			else {
				userList.clear();
				userList.add(array);
			}
		}







}
$(document).ready(function(){
	ShowStats();
});
