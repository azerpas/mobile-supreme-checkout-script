(function () {
    let keyWord = '+bloud+lust';  // +box,+logo,-bear
    let categories = ["Jackets", "Coats", "Shirts", "Tops/Sweaters", "Sweatshirts", "Pants", "Shorts", "T-Shirts", "Hats", "Bags", "Accessories", "Shoes", "Skate"]
    // 0 -> "Jackets", 1 -> "Coats", 2-> "Shirts", 3 -> "Tops/Sweaters", 4 ->"Sweatshirts", 5->"Pants", 6->"Shorts", 7->"T-Shirts",
    //8-> "Hats", 9->"Bags", 10->"Accessories", 11->"Shoes", 12->"Skate"
    let category = categories[10];
    let preferredSize = 'xlarge' 
    let preferColor = 'mustard'; 
    let autoCheckout = false; 
    let checkout_delay = 390; 


    let cnType = 'master'; // master visa (Mastercard or Visa)
    let cnb = "4444444444444444";
    let month = "11";
    let year = "2022";
    let vval = "888";

    //=======================================================================================================

    let startTime = null;
    let respondJSON = null;
    let isNew = false;
    let item_selected = true;

    let mobile_stock_api = "https://www.supremenewyork.com/mobile_stock.json";
    let event = document.createEvent('Event');
    event.initEvent('change', true, true); 

    let notifyHeader = document.createElement('p');
    notifyHeader.style.cssText = "margin: auto;width: 100%;background-color: #70de4c;";
    let refresh_count = 0;
    let parentE = document.getElementsByTagName('body')[0]
    parentE.insertBefore(notifyHeader,parentE.children[0]);

    let retryFetch = async (url, options=null, retry=0) => {
        if (retry >= 4) return Promise.resolve(1);
        let res = await fetch(url, options);
        if (res.status !== 200) {
            console.log(res.status)
            await sleep(Math.min(retry * 500, 2 * 1000));
            return await retryFetch(url, options, retry + 1);
        } else {
            console.log(res.status)
            return await res.json();
        }
    };

    function matchKeyWord (itemName, keyWords) {
        let name = itemName.toLowerCase().trim();
        let keyWordsList = keyWords.toLowerCase().split(",");
        for (let i = 0; i < keyWordsList.length; i ++) {
            let word = keyWordsList[i].trim();
            if ((word.includes('+') && !name.includes(word.substr(1))) ||
                (word.includes('-') && name.includes(word.substr(1)))) {
                return false;
            }
        }
        return true;
    };

    let sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    async function mobileAPIRefreshed(respond) {
        if (respond['products_and_categories'] == null || respond['products_and_categories']['new'] == null) {
            return false;
        }
        let newProducts = respond['products_and_categories']['new'];
        for (let index = 0; index < newProducts.length; index ++) {
            let item =newProducts[index];
            if (item != null && item['name'] != null && matchKeyWord(item['name'], keyWord)) {
                isNew = true;
                return true;
            }
        }

        let categoryProduct = respond['products_and_categories'][category];
        if (categoryProduct != undefined) {
            for (let index = 0; index < categoryProduct.length; index ++) {
                let item =categoryProduct[index];
                if (item != null && item['name'] != null && matchKeyWord(item['name'], keyWord)) {
                    isNew = false;
                    return true;
                }
            }
        }
        return false;
    }

    async function monitor() {
        if (!item_selected) {
            notifyHeader.innerHTML = 'Monitoring... Nb of refresh： ' + refresh_count;
            refresh_count ++;
            let refreshed = false;
                
            let respond = await retryFetch(mobile_stock_api);
            refreshed = respond == null ? false : await mobileAPIRefreshed(respond);
            if (refreshed) {
                respondJSON = respond;
                startTime = new Date().getTime();
                console.log("Detect Page refreshed with mobile endpoint at: " + startTime.toISOString());
                notifyHeader.innerHTML = "新品已经上线。。。如果页面没有跳转到商品页面请手动刷新并且重启程序。"
                window.location.href = isNew? 'https://www.supremenewyork.com/mobile/#categories/new' : ('https://www.supremenewyork.com/mobile/#categories/' + category);
                await sleep(230);
                start();
                return;
            } else {
                console.log("Not refreshed, retrying ...")
                await sleep(984);
                await monitor();
                return;
            }
        }
    }


    let start = () => {
        console.log("start!!");
        let items = document.getElementsByClassName("name");
        console.log(items);
        let selectedItem = null;
        if (items.length > 0) {
            notifyHeader.innerHTML = "寻找应物品中。。。如有卡顿，请手动点击商品图片。";
            for (item of items) {
                let name = item.innerHTML;
                console.log(name);
                if (matchKeyWord(name, keyWord)) {
                    startTime = new Date().getTime();
                    selectedItem =item;
                    selectedItem.click();
                    break;
                }
            }

            if (selectedItem !== null) {
                (function waitTillItemClick() {
                    items = document.getElementsByClassName("name");
                    if (items.length > 0) {
                        console.log('wait item click ...');
                        selectedItem.click();
                        setTimeout(function(){ waitTillItemClick(); }, 140);
                    } else {
                        return;
                    }
                })();
            } else {
                sleep(90).then(start);
            }
        } else {
            sleep(150).then(start);
        }
    }

    (function waitTillArticlePageIsOpen() {
        console.log('Waiting for user choice...');
        notifyHeader.innerHTML = 'Please open a product page to launch the add to cart';
        let atcBtn = document.getElementsByClassName("cart-button")[0];
        if (atcBtn) {
            startTime = new Date().getTime();
            addToCart();
        } else {
            setTimeout(function(){ waitTillArticlePageIsOpen(); }, 150);
        }
        return;
    })();



    async function addToCart(){
        if (document.getElementById('cart-update').children[0].innerHTML === "remove") {
            checkout();
           //await sleep(20000);
            return;
        }
        notifyHeader.innerHTML = "Choosing color";
        await chooseColor();
        notifyHeader.innerHTML = "Sleeping...";
        await sleep(899);
        notifyHeader.innerHTML = "Choosing size";
        chooseSize();
        notifyHeader.innerHTML = "Sleeping...";
        await sleep(1200);
        let atcBtn = document.getElementsByClassName("cart-button")[0];
        atcBtn.click();
        item_selected = true;
        
        (function waitTillCartUpdates() {
            let cart = document.getElementById("goto-cart-link").innerHTML;
            if (cart == '' || cart == 0) {
                setTimeout(function(){ waitTillCartUpdates(); }, 150);
                return;
            } else {
                // Click checkout button
                notifyHeader.innerHTML = "Checking out!";
                checkout()
                return;
            }
        })();
    }


    async function chooseColor() {
        let image;
        let url = "/shop/"+window.location.hash.split("/")[1]+".json";
        let res = await fetch(url);
        let myJson = await res.json();
        for (item of myJson.styles){
            let color = item.name;
            if (checkAvaliability(item.sizes)) {
                let id = item.id;
                let imageID = "style-"+id;
                image = document.getElementById(imageID).getElementsByClassName("style-thumb")[0]; 
                if (color.toLowerCase().includes(preferColor.toLowerCase()) || preferColor.toLowerCase() === 'any') {
                    image.click();
                    break;
                }
            }
        }
        if (image !== undefined) {
            image.click();
        }
    }

    function checkAvaliability(sizes) {
        for (size of sizes) {
            if (size['stock_level'] > 0) {
                return true;
            }
        }
        return false;
    }

    function chooseSize(){
        let sizeOpts = document.getElementsByTagName("option");
        let sizeVal = sizeOpts[0].value
        for (let option of sizeOpts){
            let size = option.text.toLowerCase();
            if (size === preferredSize.toLowerCase() || size === 'N/A'){
                sizeVal =  option.value;
                break;
            }
        }
        sizeOpts = document.getElementsByTagName("select")[0].value = sizeVal;

    }

    function checkout(){
        window.location.href = 'https://www.supremenewyork.com/mobile/#checkout';
        let checkoutBtn = document.getElementById("submit_button");
        waitTillCheckoutPageIsOpen();
    }

    async function waitTillCheckoutPageIsOpen() {

        checkoutBtn = document.getElementById("submit_button");
        if (checkoutBtn) {
            notifyHeader.innerHTML = "Checking out, inputing credit card";
        
            if(document.getElementById('credit_card_type')){
                await sleep(350);
                document.getElementById('credit_card_type').focus();
                document.getElementById('credit_card_type').value = cnType;
                document.getElementById('credit_card_type').dispatchEvent(event);
            }
            if (document.getElementById("credit_card_n")) {
                await sleep(500);
                document.getElementById("credit_card_n").focus();
                document.getElementById("credit_card_n").value = cnb;
            }
            if (document.getElementById("credit_card_month")) {
                await sleep(400);
                document.getElementById("credit_card_month").focus();
                document.getElementById("credit_card_month").value = month;
                document.getElementById("credit_card_month").dispatchEvent(event);
            }
            if (document.getElementById("credit_card_year")) {
                await sleep(400);
                document.getElementById("credit_card_year").focus();
                document.getElementById("credit_card_year").value = year;
                document.getElementById("credit_card_year").dispatchEvent(event);
            }
            if (document.getElementById("cav")) {
                await sleep(300);
                document.getElementById("cav").focus();
                document.getElementById("cav").value = vval;
            }
            if (document.getElementById("credit_card_cvv")) {
                await sleep(500);
                document.getElementById("credit_card_cvv").focus();
                document.getElementById("credit_card_cvv").value = vval;
            }

            await sleep(200);      
            document.getElementById("order_terms").click();

            notifyHeader.innerHTML = "请结账";
            if (autoCheckout){
                notifyHeader.innerHTML = "自动结账中";
                await sleep(checkout_delay);
                document.getElementById("hidden_cursor_capture").click();
            }
            else{
                notifyHeader.innerHTML = "Auto Payment not activated, please proceed!"
                console.log('Submit your order!')
            }
            console.log('paymentTime: ' + (new Date().getTime() - startTime) + ' ms');
            notifyHeader.remove();
            return;
        } else {
            setTimeout(async function(){ await waitTillCheckoutPageIsOpen(); }, 200);
            console.log("PLEASE OPEN CHECKOUT PAGE");
        }
    }

    monitor()
})()

completion()
