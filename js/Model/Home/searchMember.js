layui.use(['layer', 'jquery'], function () {
    var layer = layui.layer, $ = layui.$, form = layui.form;
    $('#search').on('click', function (e) {
        e.preventDefault();
        var value = $(this).parent().prev().find('input').val()
        if (!value.match(verify.empty[0])) {
            var param = {
                Type: 1,
                SearchCriteria: value
            }
            $.http.post(LuckVipsoft.api.SearchMemCardList, param, $.session.get('Cashier_Token'), function (res) {
                layer.msg(res.msg)
                if (res.status == 1) {
                    var html = '';
                    for (i = 0; i < res.data.length; i++) {
                        if (i == 0) {
                            html += '<tr class="lomo-mem-list">';
                        } else {
                            html += '<tr >';
                        }
                        html += '<td>' + res.data[i].CardID + '</td>';
                        html += '<td>' + res.data[i].CardName + '</td>';
                        html += '<td>' + res.data[i].Mobile + '</td>';
                        html += '<td>' + res.data[i].LevelName + '</td>';
                        html += '<td>' + res.data[i].Point + '</td>';
                        html += '<td>¥' + res.data[i].RemainingCount + '</td>';
                        html += '</tr>';
                    };
                    $('#memList').html(html);
                }
            })
        } else {
            layer.msg(LuckVipsoft.lan.ER0021)
        }
    });
    /*选中 */
    $('#memList').on('click', 'td', function () {
        $(this).parent().addClass('lomo-mem-list').siblings().removeClass('lomo-mem-list')
    });
})