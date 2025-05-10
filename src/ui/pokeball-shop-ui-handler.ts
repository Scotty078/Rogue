import { globalScene } from "#app/global-scene";
import { addTextObject, TextStyle } from "./text";
import { addWindow } from "./ui-theme";
import { Button } from "#enums/buttons";
import { UiMode } from "#enums/ui-mode";
import { PokeballType } from "#enums/pokeball";
import { getPokeballName } from "../data/pokeball";
import { SolPayments } from "../sol-payments";
import i18next from "i18next";
import UiHandler from "./ui-handler";

export default class PokeballShopUiHandler extends UiHandler {
  private shopContainer: Phaser.GameObjects.Container;
  private options: Phaser.GameObjects.Container[];
  private cursorObj: Phaser.GameObjects.Image | null;
  private solPayments: SolPayments;

  constructor() {
    super(UiMode.POKEBALL_SHOP);
    this.options = [];
    this.cursorObj = null;
    this.solPayments = SolPayments.getInstance();
  }

  setup() {
    const ui = this.getUi();

    this.shopContainer = globalScene.add.container(0, 0);
    ui.add(this.shopContainer);

    const bg = addWindow(0, 0, 200, 200);
    bg.setOrigin(0, 0);
    this.shopContainer.add(bg);

    // Add Pokeball options
    const pokeballTypes = [
      PokeballType.POKEBALL,
      PokeballType.GREAT_BALL,
      PokeballType.ULTRA_BALL,
      PokeballType.ROGUE_BALL,
      PokeballType.MASTER_BALL,
      PokeballType.LUXURY_BALL
    ];

    pokeballTypes.forEach((type, i) => {
      const optionContainer = globalScene.add.container(10, 10 + i * 30);
      
      const nameText = addTextObject(0, 0, getPokeballName(type), TextStyle.WINDOW);
      const priceText = addTextObject(150, 0, `${this.solPayments.getPokeballPrice(type)} SOL`, TextStyle.WINDOW);
      
      optionContainer.add(nameText);
      optionContainer.add(priceText);
      
      this.shopContainer.add(optionContainer);
      this.options.push(optionContainer);
    });

    // Add cancel option
    const cancelContainer = globalScene.add.container(10, 10 + pokeballTypes.length * 30);
    const cancelText = addTextObject(0, 0, i18next.t("common:cancel"), TextStyle.WINDOW);
    cancelContainer.add(cancelText);
    this.shopContainer.add(cancelContainer);
    this.options.push(cancelContainer);

    this.setCursor(0);
  }

  show(args: any[]): boolean {
    super.show(args);
    this.shopContainer.setVisible(true);
    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();
    let success = false;

    if (button === Button.ACTION) {
      if (this.cursor < this.options.length - 1) {
        // Purchase Pokeball
        const pokeballType = this.cursor as PokeballType;
        this.solPayments.purchasePokeballs(pokeballType, 1).then(() => {
          ui.setMode(UiMode.MESSAGE);
          ui.showText(i18next.t("pokeball:purchaseSuccess"));
        }).catch(error => {
          ui.setMode(UiMode.MESSAGE);
          ui.showText(error.message);
        });
        success = true;
      } else {
        // Cancel
        ui.setMode(UiMode.MESSAGE);
        success = true;
      }
    } else if (button === Button.CANCEL) {
      ui.setMode(UiMode.MESSAGE);
      success = true;
    } else {
      switch (button) {
        case Button.UP:
          success = this.setCursor(this.cursor ? this.cursor - 1 : this.options.length - 1);
          break;
        case Button.DOWN:
          success = this.setCursor(this.cursor < this.options.length - 1 ? this.cursor + 1 : 0);
          break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  setCursor(cursor: number): boolean {
    const ui = this.getUi();
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.image(0, 0, "cursor");
      this.shopContainer.add(this.cursorObj);
    }

    const option = this.options[this.cursor];
    this.cursorObj.setPosition(option.x - 20, option.y);

    return ret;
  }

  clear() {
    super.clear();
    this.shopContainer.setVisible(false);
  }
} 