const jwt = localStorage.getItem('jwt');

if (!jwt) {
    // window.location.assign('index.html');
    window.location.href = "index.html";
    
}

var transactionsData = []

var queryData = {
  query: `
  query GetUser($userId: Int!) {
  user(where: {id: {_eq: $userId}}) {
    login
    id
    campus
    profile
    attrs
    progresses(
      where: {_and: [{isDone: {_eq: true}}, {object: {type: {_eq: "project"}}}]}
    ) {
      grade
    }
  }
  transaction(
    where: {_and: [{userId: {_eq: $userId}}, {user: {id: {_eq: $userId}}}, {object: {type: {_eq: "project"}}}, {type: {_eq: "xp"}}, {amount: {_gt: 4999}}, {amount: {_neq: 14700}}]}
    order_by: {createdAt: asc}
  ) {
    amount
    createdAt
    type
    object {
      name
    }
  }
  auditRatioUp: transaction(
    where: {_and: [{userId: {_eq: $userId}}, {type: {_eq: "up"}}]}
    order_by: {createdAt: desc}
  ) {
    amount
  }
  auditRatioDown: transaction(
    where: {_and: [{userId: {_eq: $userId}}, {type: {_eq: "down"}}]}
    order_by: {createdAt: desc}
  ) {
    amount
  }
  linegraph: transaction(
    where: {_and: [{userId: {_eq: $userId}}, {user: {id: {_eq: $userId}}}, {_or: [{object: {type: {_eq: "project"}}}, {object: {type: {_eq: "piscine"}}}]}, {type: {_eq: "xp"}}, {amount: {_gt: 4999}}, {amount: {_neq: 14700}}]}
    order_by: {createdAt: asc}
  ) {
    amount
    createdAt
    type
    object {
      name
      type
    }
  }
}

`}

//******************************************************************************* */
  async function postData(url = '', query = {}) {
    const token = window.localStorage.getItem('jwt');
    console.log("token", token)
    const userId = await getUserId(token);
  
    const variables = {
      userId: userId,
    }
  
    const authorization = `Bearer ${token}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({query, 
      variables: variables  })
    })
  
    return response.json()
  } 

  const resp = postData('https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql', queryData.query)
//**************************************************************************************************** */
async function getUserId(token) {
   // Vérifier que token est une chaîne de caractères
   if (typeof token !== 'string') {
    // throw new Error('Token doit être une chaîne de caractères.');
    console.log("Pas de token")
  }

  try {
    // Split the token into header, payload, and signature parts
    const [headerBase64, payloadBase64, signatureBase64] = token.split('.');

    // Decode the payload (claims)
    const payload = JSON.parse(atob(payloadBase64));

    return payload.sub;
  } catch (error) {
    // En cas d'erreur, rediriger vers index.html
    window.location.href = "index.html";
    console.log("Pas de token valide")
  }
}
  function user(user, transactions) {
    console.log("user", user[0])
    console.log("transactionsuser", transactions)
    //Id
    const id = document.querySelector('#id')
    id.innerText = user[0].id

    const campus = document.querySelector('#campus')
    campus.innerText = user[0].campus.toUpperCase()

    const username = document.querySelector('#username')
    username.innerText = user[0].login
    //Grade
    var gradeTotal = 0
    var progresses = user[0].progresses
    progresses.forEach(({ grade }) => {
      gradeTotal += grade
    });
    const gradeAvg = Math.round((gradeTotal / progresses.length) * 100) / 100
  
    const gradeDiv = document.querySelector('#grade');
    gradeDiv.innerText = gradeAvg
  
  
    //XP
    const totalXp = getTotalXp(transactions)
    document.querySelector('#xp').innerText = totalXp + ' kB'
  }
  
//****************************************************************************************** */
  function getTotalXp(data) {
    let xp = 0
    data.forEach(({ amount }) => {
      xp += amount
      console.log('amount: ', amount)
    });
    console.log('xp ', xp)
    var totalXp = Math.round((xp + 800) / 1000)
    return totalXp + 4
  }
  
  
  function auditRatio(down, up) {
    console.log("down", down)
  
    //received
    var totalDown = 0
    down.forEach(({ amount }) => {
      totalDown += amount
    });
    console.log("total down", totalDown)
  
    //done
    var totalUp = 0
    up.forEach(({ amount }) => {
      totalUp += amount
    });
    console.log("total up", totalUp / 12000)
  
    let avg = Math.round((totalUp / totalDown) * 10) / 10
    console.log("avg ", avg)
    document.querySelector("#ratio").innerText = avg
  
    //SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('height', `${100}px`);
    svg.setAttribute('width', `${220}px`);
    svg.setAttribute('background', '#8BD17C')
   
  
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const barUp = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    barUp.setAttribute('width', totalUp / 12000);
    barUp.setAttribute('height', 19);
    barUp.setAttribute('y', 20);
    barUp.setAttribute('rx', 3)
    g.appendChild(barUp);
  
    var done = document.createTextNode("done");
    const textUp = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textUp.setAttribute('x', totalUp / 12000 + 10)
    textUp.setAttribute('y', 30)
    textUp.setAttribute('dy', `${.35}em`)
    textUp.setAttribute('fill', 'rgb(183, 183, 183)')
    textUp.setAttribute('class', 'audit-text')
    textUp.appendChild(done);
    g.appendChild(textUp)
  
  
    const barDown = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    barDown.setAttribute('width', totalDown / 12000);
    barDown.setAttribute('height', 19);
    barDown.setAttribute('y', 60);
    barDown.setAttribute('rx', 3)
    g.appendChild(barDown);
    svg.appendChild(g);
  
    var received = document.createTextNode("received");
    const textDown = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textDown.setAttribute('x', totalDown / 12000 + 10)
    textDown.setAttribute('y', 70)
    textDown.setAttribute('dy', `${.35}em`)
    textDown.setAttribute('fill', 'rgb(183, 183, 183)')
    textDown.setAttribute('class', 'audit-text')
    textDown.appendChild(received);
    g.appendChild(textDown)
  
    svg.appendChild(g);
  
    document.getElementById('audit-ratio').appendChild(svg);
  }
  //********************************************************************************************* */
  function createLineChart(data) {
    console.log("length", data.length)
  
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('height', `${300}px`);
    svg.setAttribute('width', `${900}px`);
    svg.setAttribute('viewBox', `-30 -60 900 400`);
  
    const startDate = Date.parse('11 Oct 2021 00:12:00 GMT')
  
  
    console.log("startdate", startDate);
    var xp = 0
  
    var points = [0, 300]
    let created = []
    var xy = []
  
    data.map(({ amount, createdAt }) => {
      xp += amount
  
  
      // Calculate scaling factors based on the number of data points
      const scaleFactorX = 2200000 / data.length * 1000;
      const scaleFactorY = 80000 / data.length;
  
  
      created = (Date.parse(createdAt) - startDate) / scaleFactorX
      console.log("createdat", created)
      let yPos = 300 - xp / scaleFactorY
      points.push(created, yPos)
      xy.push({
        x: created,
        y: yPos,
        mill: (Date.parse(createdAt)),
        xp: amount
      });
  
    });
  
    console.log("points", points)
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', '#79a6fe')
    line.setAttribute('stroke-width', 1);
    line.setAttribute('points', `${points}`);
  
    svg.appendChild(line)
  
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  
    xy.forEach(({ x, y, mill, xp }) => {
      const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).format(mill);
      const kB = Math.round((xp / 1000) * 10) / 10
  
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x)
      circle.setAttribute('cy', y)
      circle.setAttribute('r', 3)
      // circle.setAttribute('data-value', 6)
      g.appendChild(circle);
  
      circle.addEventListener('mouseover', () => {
  
        circle.setAttribute('r', 7)
  
        var dateNode = document.createTextNode(date);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x - 50)
        text.setAttribute('y', y - 20)
        text.setAttribute('dy', `${.35}em`)
        text.setAttribute('class', 'circle-text')
        text.appendChild(dateNode);
        g.appendChild(text)
  
        var xpNode = document.createTextNode(`+ ${kB} kB`);
        const xpText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xpText.setAttribute('x', x - 50)
        xpText.setAttribute('y', y - 10)
        xpText.setAttribute('dy', `${.35}em`)
        xpText.setAttribute('class', 'circle-text')
        xpText.setAttribute('width', '100px')
        xpText.appendChild(xpNode);
        g.appendChild(xpText)
  
  
        circle.addEventListener('mouseout', () => {
          xpText.remove()
          text.remove()
  
          circle.setAttribute('r', 3)
  
        })
      })
    });
    const currXp = getTotalXp(data)
    var totalNode = document.createTextNode('Total');
    const total = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    total.setAttribute('x', 465)
    total.setAttribute('y', 20)
    total.setAttribute('dy', `${.35}em`)
    total.setAttribute('class', 'circle-text')
    total.appendChild(totalNode);
    g.appendChild(total)
    var totalNode = document.createTextNode(currXp + ' kB');
    const totalXp = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    totalXp.setAttribute('x', 465)
    totalXp.setAttribute('y', 30)
    totalXp.setAttribute('dy', `${.35}em`)
    totalXp.setAttribute('class', 'circle-text')
    totalXp.appendChild(totalNode);
    g.appendChild(totalXp)
  
    var startNode = document.createTextNode("Oct '21");
    const start = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    start.setAttribute('x', -17)
    start.setAttribute('y', 312)
    start.setAttribute('dy', `${.35}em`)
    start.setAttribute('class', 'circle-text')
    start.appendChild(startNode);
    g.appendChild(start)
  
    svg.appendChild(g);
  
    document.getElementById('line-chart').appendChild(svg);
  
  }
  
  
  function createBarChart(data) {
  
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('height', `${100}%`);
    svg.setAttribute('width', `${100}%`);
    svg.setAttribute('viewBox', `-15 0 640 200`);
    console.log("data", data)
  
    var xCounter = 30
    var xy = []
  
    data.map(({ amount, object }) => {
  
      xy.push({
        x: xCounter,
        y: 190 - (amount / 2700),
        xp: amount,
        name: object.name
  
      });
  
      xCounter += 22
  
    });
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  
    xy.map(({ x, y, xp, name }) => {
  
      const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bar.setAttribute('width', `${19}`);
      bar.setAttribute('height', `${xp / 2700}`);
      bar.setAttribute('x', x);
      bar.setAttribute('y', y);
      bar.setAttribute('rx', 3)
      bar.setAttribute('class', 'bar')
      svg.appendChild(bar);
      xCounter += 22
  
      const kB = Math.round((xp / 1000) * 10) / 10
  
      bar.addEventListener('mouseover', () => {
  
        var nameNode = document.createTextNode(name);
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('x', 30)
        nameText.setAttribute('y', 60)
        nameText.setAttribute('dy', `${.35}em`)
        nameText.setAttribute('fill', 'RGB(231, 195, 227)')
        nameText.setAttribute('class', 'name-text')
        nameText.appendChild(nameNode);
        g.appendChild(nameText)
  
        var xpNode = document.createTextNode(`${kB} kB`);
        const xpText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xpText.setAttribute('x', 30)
        xpText.setAttribute('y', 80)
        xpText.setAttribute('dy', `${.35}em`)
        xpText.setAttribute('class', 'kb-text')
        xpText.setAttribute('fill', 'RGB(255, 255, 255)')
        xpText.appendChild(xpNode);
        g.appendChild(xpText)
  
        bar.addEventListener('mouseout', () => {
          nameText.remove()
          xpText.remove()
        })
      })
  
    });
  
    svg.appendChild(g);
    document.getElementById('bar-chart').appendChild(svg);
  
  }

  resp.then((result) => {

    console.log("resultttttttttttttttttttttt", result)
    var username = result.data.user[0].login
    console.log(username)

    var transactions = result.data.transaction

    for (var i = 0; i < transactions.length; i++) {
      transactionsData.push({
        amount: transactions[i].amount,
        createdAt: transactions[i].createdAt,
        object: {
          name: transactions[i].object.name
        }
      })
    }
    console.log("all transactions", transactionsData)
    const attrs = result.data.user[0].attrs;
    const email = attrs.email;
    const lastName = attrs.lastName
    const firstName = attrs.firstName
    const nm = document.querySelector('#name')
    const mail = document.querySelector('#email')
    mail.innerText = email
    nm.innerText = firstName + " " + lastName

    console.log(email);

    user(result.data.user, result.data.linegraph)
    auditRatio(result.data.auditRatioDown, result.data.auditRatioUp)
    createBarChart(transactions)
    createLineChart(result.data.linegraph)
  })
  .catch((error) => console.log('error', error));
  
  // Logout Function
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', () => {
  logout();
  });
  
  async function logout() {
      try {
          await fetch('https://learn.zone01dakar.sn/api/auth/signout', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
          });
      } catch (error) {
          console.error(error);
          } finally {
                document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              localStorage.removeItem('jwt');
              window.location.assign('index.html');
          }
  }
