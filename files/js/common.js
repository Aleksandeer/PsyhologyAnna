$( ".openModal" ).click(function(e) {
    e.preventDefault();
    $('#modal1').arcticmodal();
});
var date_now =  new Date(2023,10,0);


function newDate() {
  var time = new Date();
  date_now.setDate(date_now.getDate() + 1);
  $(".date-block").text(date_now.toLocaleString('ru-ru', {
    day: 'numeric',
    month: 'long' 
  }));
}
setTimeout(newDate, 100);


var myDate = new Date();
function returnEndDate(d,h,m){
  myDate.setDate(myDate.getDate()+d);
  myDate.setHours(myDate.getHours()+h);
  myDate.setMinutes(myDate.getMinutes()+m);
  return myDate;
}
if($.cookie("time-timer1")){
  var dateEnd = $.cookie("time-timer1");
}else{
  var dateEnd = returnEndDate(0,3,0);
  $.cookie("time-timer1", dateEnd, {expires: 7});
}
// var date = new Date($.cookie("time-timer1"));
var date = date_now
$(".getting-started").countdown(date, function(event) {
  $(this).html(
  event.strftime(''
      +'<div class="hr"><div class="dial">%D</div>дней</div>'
  +'<div class="hr"><div class="dial">%H</div>часов</div>'
  +'<div class="min"><div class="dial">%M</div>минут</div>'
  +'<div class="sec"><div class="dial">%S</div>секунд</div>'));
});

! function(i) {
  var o, n;
  i(".title_block").on("click", function() {
    o = i(this).parents(".accordion_item"), n = o.find(".info"),
      o.hasClass("active_block") ? (o.removeClass("active_block"),
        n.slideUp()) : (o.addClass("active_block"), n.stop(!0, !0).slideDown(),
        o.siblings(".active_block").removeClass("active_block").children(
          ".info").stop(!0, !0).slideUp())
  })
}(jQuery);

$(document).ready(function(){
    var $menu = $("#menu");
    $(window).scroll(function(){
        if ( $(this).scrollTop() > 1000 && $menu.hasClass("default") ){
            $menu.removeClass("default").addClass("fixed");
        } else if($(this).scrollTop() <= 1000 && $menu.hasClass("fixed")) {
            $menu.removeClass("fixed").addClass("default");
        }
    });//scroll
});

$('.gallery').slick({
  adaptiveHeight: true
});