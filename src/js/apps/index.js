(function(){
  // UI기본동작 (가이드용도의 코드입니다.)
  //social area toggle
  let socialArea = document.querySelector('.social_area');
  let btnPanel = document.querySelector('.btn_panel');
  socialArea &&  btnPanel.addEventListener('click',()=>socialArea.classList.toggle('is_act'));

  // password toggle
  let btnView = document.querySelectorAll('.input_password .btn_view_input');
  let btnIcon = document.querySelectorAll('.input_password .btn_view_input .ic');
  let inputText = document.querySelectorAll('.input_password .input_text');
  btnView && btnView.forEach((view, i) => {
    view.addEventListener('click', function () {
      if (btnIcon[i].classList.contains('ic_view_hidden_bold_20px')) {
        btnIcon[i].setAttribute("class", "ic ic_view_bold_20px",);
        btnIcon[i].setAttribute("aria-label", "비밀번호 숨기기");
        inputText[i].setAttribute('type', 'text');
      } else {
        btnIcon[i].setAttribute("class", "ic ic_view_hidden_bold_20px",);
        btnIcon[i].setAttribute("aria-label", "비밀번호 보기");
        inputText[i].setAttribute('type', 'password');
      }
    });
  });

  // option menu toggle
  let optionInputArr = document.querySelectorAll('.option_wrap .input_box');
  let optionButtonArr = document.querySelectorAll('.option_wrap .btn_filter');
  let optionFunc= () => {
  optionButtonArr && optionButtonArr.forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(btn.closest('.option_wrap')){  btn.closest('.option_wrap').classList.toggle('option_open')};
      })
    })
   optionInputArr && optionInputArr.forEach(input=>{
      input.addEventListener('click',()=>{
        let parent = input.closest('.option_wrap');
        if (parent.classList.contains('option_open')) {
          input.classList.remove('input_focused');
          parent.classList.remove('option_open');
        } else if (!parent.classList.contains('option_open')){
          parent.classList.add('option_open');
          input.classList.add('input_focused');
        }
      })
    });
  }
  optionFunc();

  // Tab
  let tabArr = document.querySelectorAll('.btn_tab');
  let tabPanel = document.querySelectorAll('.tab_panel');
  let tabInitFunc=function(index){
    tabArr.forEach((tab, i)=>{
      if(i===index){
        tab.classList.add('btn_tab_active');
        if(tabPanel.length){
          tabPanel[index].style.display='block';
        }
      }else {
        tab.classList.remove('btn_tab_active');
        if(tabPanel.length){
          tabPanel[i].style.display='none';
        }
      }
    });
  }
  tabArr && tabArr.forEach((item, i)=>{
    item.addEventListener('click',()=>{
      tabInitFunc(i);
    });
  });

  // Pin Code
  let pincodeCustom = document.querySelectorAll('.pincode_type2 .input_text');
  const hiddenValue = '●';
  pincodeCustom && pincodeCustom.forEach((pin, idx)=>{
    pin.addEventListener('input', function(e){
      if (e.target.value != hiddenValue && e.target.value){
        // [D] 마스킹할 요소
        let timeEv = setTimeout(function(){
          if (e.target.value != hiddenValue) {
            e.target.dataset.realValue = e.target.value;
          }
          e.target.value = hiddenValue;
          if(idx + 1<=3){ pincodeCustom[idx+1].focus() }
          else { 
            pincodeCustom[3].closest('.input_pincode').classList.remove('input_focused')
            pincodeCustom[3].blur()
          };
          clearTimeout(timeEv);
        },1000);
      }
    });
    pin.addEventListener('focus', function (e) {
      if (e.target.value == hiddenValue) {
        e.target.value = e.target.dataset.realValue;
      }
      e.target.closest('.pincode_type2').classList.remove('pincode_font27');
    });
    pin.addEventListener('blur', function (e) {
      e.target.closest('.pincode_type2').classList.add('pincode_font27');
      if (e.target.value) {
        if (e.target.value != hiddenValue){
          e.target.dataset.realValue = e.target.value;
        }
        e.target.value = hiddenValue;
      }
    });
  });
//scroll height check
//해당하는 페이지 - 05_02_del_account_service :: 리스트 높이 164 기준으로 클래스 토글 필요
//해당 html에 케이스뷰로 처리해두었으나 히스토리 확인을 위해 코드 삭제하지 말아주세요.

  // function debounce(callback, wait) {
  //   let timeout;
  //   return function (...args) {
  //     const context = this;
  //     clearTimeout(timeout);
  //     timeout = setTimeout(() => callback.apply(context, args), wait);
  //   }
  // }
  // let listEl = document.querySelector('.wrap_type_fit .info_wrap');
  // let checkHeightFunc = function () {
  //   listEl = document.querySelector('.wrap_type_fit .info_wrap');
  //   if(listEl.closest('.page_my_info')){  console.log('in'); return;}
  //   let _this = listEl;
  //   if (_this && _this.scrollHeight  > 164 ){
  //     _this.classList.add('content_scroll');
  //   } else if (_this && _this.scrollHeight <= 164){
  //     _this.classList.remove('content_scroll');
  //   }
  // }
  // window.addEventListener('DOMContentLoaded', function () {
  //   checkHeightFunc();
  // });
  // window.addEventListener('resize', debounce(checkHeightFunc, 500));
})();