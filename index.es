import React, { Component } from 'react'
import { Button, TextArea, ButtonGroup, Icon } from "@blueprintjs/core";
import { connect } from 'react-redux'
import { shell } from 'electron'

export const windowMode = false;

const parseShip = (ship) => {
    let tempObj =
    {
        "id": ship.api_ship_id,
        "lv": ship.api_lv,
        "st": ship.api_kyouka,
        "exp": ship.api_exp,
        "ex": ship.api_slot_ex
    }

    if (ship.api_sally_area) {
        tempObj.area = ship.api_sally_area
    }

    return tempObj;
}



export const reactClass = connect(state => ({
    hqlv: state.info.basic.api_level,
    fleets: state.info.fleets,
    ships: state.info.ships,
    equips: state.info.equips,
    airbases: state.info.airbase
}))(class view extends Component {
    constructor(props) {
        super(props);
        this.handleActivityAirbaseChange = this.handleActivityAirbaseChange.bind(this);
    }

    state = { result: "", selectAirbasesWorld: "event", activityAirbaseOnly: 'to-be-decreated', curOutput: null, errorMsg: null};

    //艦娘資料輸出(包含未上鎖)
    //另3function程式碼大致相同
    exportShipsAll = () => {
        //讀取資料
        const ships = this.props.ships;
        let json_result = []
        Object.keys(ships).forEach((key) => {
            const ship = ships[key]
            json_result.push(parseShip(ship))
        })
        let result = JSON.stringify(json_result)
        let curOutput = "ships"
        this.setState({ result, curOutput})

        return result;
    }

    //艦娘資料輸出(不包含未上鎖)
    exportShipsLocked = () => {
        const ships = this.props.ships;
        let json_result = []
        Object.values(ships)
            .filter(ship => {
                return ship.api_locked == "1"
            }).forEach(ship => {
                json_result.push(parseShip(ship))
            })

        let result = JSON.stringify(json_result)
        let curOutput = "ships"
        this.setState({ result, curOutput})
        return result;
    }



    //裝備資料輸出(包含未上鎖)
    exportEquipsAll = () => {
        const equips = this.props.equips;
        let result = `[`;
        const len = Object.keys(equips).pop();

        for (let j = 0; j <= len; j++) {
            if (equips[j]) {
                const equip = equips[j];
                if(equip.api_level == undefined) {
                    result += `{"id":${equip.api_slotitem_id},"lv":0},`
                }
                else {
                    result += `{"id":${equip.api_slotitem_id},"lv":${equip.api_level}},`
                }
            }
        }
        if (result.charAt(result.length - 1) == ',') {
            result = result.slice(0, result.length - 1)
        }
        result += `]`
        let curOutput = "items"
        this.setState({ result, curOutput})

        return result;
    }


    //裝備資料輸出(不包含未上鎖)
    exportEquipsLocked = () => {
        const equips = this.props.equips;
        let result = `[`;
        const len = Object.keys(equips).pop();

        for (let j = 0; j < len; j++) {
            if (equips[j]) {
                const equip = equips[j];
                if (equip.api_locked == "0") {
                    continue;
                }
                if(equip.api_level == undefined) {
                    result += `{"id":${equip.api_slotitem_id},"lv":0},`
                }
                else {
                    result += `{"id":${equip.api_slotitem_id},"lv":${equip.api_level}},`
                }
            }
        }
        if (result.charAt(result.length - 1) == ',') {
            result = result.slice(0, result.length - 1)
        }
        result += `]`
        let curOutput = "items"
        this.setState({ result, curOutput})

        return result;
    }

    exportFleet = () => {
        //读取舰队信息
        const fleets = this.props.fleets;
        //读取船只信息
        const ships = this.props.ships;
        //读取装备信息
        const equips = this.props.equips;
        //读取陆航信息
        const airbases = this.props.airbases;
        //初始化字符串
        let result = `{"version": 4,"hqlv":${this.props.hqlv},`;

        //遍历母港中的舰队并且生成json
        for (let i = 0; i < fleets.length; i++) {
            const fleet = fleets[i];
            result += `"f${i + 1}":{`;
            //遍历舰队中的中船只
            for (let j = 0; j < fleet.api_ship.length; j++) {
                if (ships[fleet.api_ship[j]]) {
                    const ship = ships[fleet.api_ship[j]];
                    result += `"s${j + 1}":{"id":${ship.api_ship_id},"lv":${ship.api_lv},"luck":${ship.api_lucky[0]},"items":{`;
                    //遍历船只的装备
                    for (let k = 0; k < ship.api_slot.length; k++) {
                        const slot = ship.api_slot[k];
                        if (equips[slot]) {
                            const equip = equips[slot];
                            result += `"i${k + 1}":{"id":${equip.api_slotitem_id},"rf":${equip.api_level}`
                            if (equip.api_alv) {
                                result += `,"mas":${equip.api_alv}`
                            }
                            result += `},`
                        }
                    }
                    //查看是否存在额外装备（孔）
                    if (equips[ship.api_slot_ex]) {
                        const equip = equips[ship.api_slot_ex]
                        result += `"ix":{"id":${equip.api_slotitem_id},"rf":${equip.api_level}`
                        if (equip.api_alv) {
                            result += `,"mas":${equip.api_alv}`
                        }
                        result += `}`
                    }
                    //去除最后的逗号并且补上items的后括号
                    if (result.charAt(result.length - 1) == ',') {
                        result = result.slice(0, result.length - 1) + `}`
                    } else {
                        result += `}`
                    }
                    //补上ships的后括号
                    result += `},`
                }
            }
            //去除最后的逗号并且补上fleets的后括号
            if (result.charAt(result.length - 1) == ',') {
                result = result.slice(0, result.length - 1) + `},`
            } else {
                result += `},`
            }
        }
        //遍历陆航中的航空中队
        let airbase_cnt = 0;
        // console.log(`[kanexport] activityAirbaseOnly ${this.state.activityAirbaseOnly}`);
        console.log(`[kanexport] selected airbases ${this.state.selectedAirbases}`);

        for (let i = 0; i < airbases.length; i++) {
            const airbase = airbases[i];
            console.log(`[kanexport] airbase-${i + 1} on area ${airbase.api_area_id}`);
            if (!this.state.selectedAirbases) continue;
            if (this.state.selectedAirbases == 'event') 
                if (airbase.api_area_id < 30)
                    continue;
            else if (this.state.selectedAirbases != airbase.api_area_id) 
                continue;
            console.log(`[kanexport] airbase-${i + 1} join`);
            airbase_cnt += 1;
            result += `"a${airbase_cnt}":{"items": {`;
            //遍历航空中队中的飞机
            for (let j = 0; j < airbase.api_plane_info.length; j++) {
                const plane = airbase.api_plane_info[j];
                if (equips[plane.api_slotid]) {
                    const equip = equips[plane.api_slotid]
                    result += `"i${j + 1}":{"id":${equip.api_slotitem_id},"rf":${equip.api_level}`
                    if (equip.api_alv) {
                        result += `,"mas":${equip.api_alv}`
                    }
                    result += `},`
                }
            }
            //去除最后的逗号并且补上items的后括号
            if (result.charAt(result.length - 1) == ',') {
                result = result.slice(0, result.length - 1) + `},`
            } else {
                result += `},`
            }
            //加上航空中队的行动状态
            result += `"mode":${airbase.api_action_kind}},`
        }

        //去除最后的逗号并且补上json字符串的后括号
        if (result.charAt(result.length - 1) == ',') {
            result = result.slice(0, result.length - 1) + `}`
        } else {
            result += `}`
        }
        //更新result
        let curOutput = 'predeck'
        this.setState({ result, curOutput})
        console.log(this.state);
        return result;
    }

    exportNoro6 = async () => {
        const c_result = this.state.result;
        const c_curOutput = this.state.curOutput;
        if (this.state.curOutput == null){
            const errorMsg = "未有導入內容"
            this.setState({ errorMsg })
            return
        }
        
        const url = `https://noro6.github.io/kc-web/#import:{"${c_curOutput}":${c_result}}`
        try{
            await shell.openExternal(url)
          }catch(e){
            const errorMsg = "文本過長，需要手動輸入。點擊《複製到剪貼簿》並貼入noro6相應位置"
            this.setState({ errorMsg })
        }
    }

    openNoro6 = () => {
        shell.openExternal("https://noro6.github.io/kc-web/")
    }


    exportJervis = () => {
        if (this.state.curOutput != "ships"){
            const errorMsg = "Jervis 只能導入艦隊"
            this.setState({ errorMsg })
            return
        }

        const result = this.state.result;
        shell.openExternal(`https://jervis.vercel.app/zh-CN/?predeck=${result}`)
    }

    openJervis = () => {
        shell.openExternal("https://jervis.vercel.app")
    }

    handleActivityAirbaseChange = (event) => {
        console.log(`[kanexport] handleActivityAirbaseChange "${event.target.value}"`);
        const value = event.target.value;
        this.setState({selectAirbasesWorld: value});
    }

    copyToClipboard = () => {
        const content = document.createElement('input')
        const text = this.state.result;
        document.body.appendChild(content);
        content.value = text;
        content.select();
        document.execCommand('copy');
        document.body.removeChild(content);
    }

    render() {
        const result = this.state.result;
        const errorMsg = this.state.errorMsg;
        const OutputTypeName = {
            null:null,
            predeck:'艦隊',
            ships:'艦娘',
            items:'装備'
        }[this.state.curOutput]

        return (
            <div style={{ marginLeft: "10px" }}>
                <h2>艦隊導出➕</h2>
                <br/>
                <h4>艦隊、航空隊情報</h4>
                    <Button onClick={this.exportFleet}>
                        刷新艦隊、航空隊
                    </Button>
                <label style={{ marginLeft: "10px" }}>指定海域基地航空隊：
                <select name="airbases" onChange={this.handleActivityAirbaseChange}>
                    <option value="">不輸出</option>
                    <option value="6">中部海域(W6)</option>
                    <option value="7" >南西海域(W7)</option>
                    <option value="event" selected>活動限定海域</option></select>
                </label>

                <h4>艦娘、装備情報</h4>
                <label>艦娘&nbsp;&nbsp;&nbsp;</label>
                <Button onClick={this.exportShipsAll}>
                    包含<b>未</b>上鎖&nbsp;&nbsp;&nbsp;
                </Button>
                <Button onClick={this.exportShipsLocked}>
                    只包含<b>上鎖</b>&nbsp;&nbsp;&nbsp;
                </Button>

                <br/>
                <label>裝備&nbsp;&nbsp;&nbsp;</label>
                <Button onClick={this.exportEquipsAll}>
                    包含<b>未</b>上鎖&nbsp;&nbsp;&nbsp;
                </Button>
                <Button onClick={this.exportEquipsLocked}>
                    只包含<b>上鎖</b>&nbsp;&nbsp;&nbsp;
                </Button>

                <h4>導出內容</h4>
                <h5>&nbsp;&nbsp;&nbsp;{OutputTypeName}</h5>
                <TextArea style={{ height: "350px" }} placeholder="按下以上按鈕加載" className=":readonly" fill={true} value={result} ></TextArea>
                <h5>{errorMsg}</h5>
                <Button onClick={this.exportNoro6}>
                        導出至noro6
                </Button>
                <Button onClick={this.exportJervis}>
                        導出至作戦室Jervis
                </Button>
                <Button onClick={this.copyToClipboard}>
                        複製到剪貼簿
                </Button>


                <ButtonGroup>
                <Button onClick={this.openNoro6}>
                    制空権シミュレータ(noro6)
                </Button>

                <Button onClick={this.openJervis}>
                作戦室Jervis
                </Button>
                </ButtonGroup>
                
            </div>
            
        )
    }
})